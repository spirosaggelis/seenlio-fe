/**
 * BigQuery SQL for site analytics — must stay consistent with bi/queries/events.py
 * (same table, event names, and event_params keys).
 *
 * GA4 export: `event_date` is STRING `YYYYMMDD`. Pass query params from
 * `ga4EventDateParams()` in client.ts — do not use raw ISO dates in BETWEEN.
 */

import { getEventsTableRef } from './client';

const GA_SESSION = `(SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')`;
const PAGE_PATH = `(SELECT COALESCE(value.string_value, '') FROM UNNEST(event_params) WHERE key = 'page_path')`;
const ITEM_CODE = `(SELECT COALESCE(value.string_value, '') FROM UNNEST(event_params) WHERE key = 'item_code')`;
const PARAM_PLATFORM = `(SELECT COALESCE(value.string_value, '') FROM UNNEST(event_params) WHERE key = 'platform')`;
const CLICK_SOURCE = `(SELECT COALESCE(value.string_value, '') FROM UNNEST(event_params) WHERE key = 'click_source')`;
const SEARCH_TERM = `(SELECT COALESCE(value.string_value, '') FROM UNNEST(event_params) WHERE key = 'search_term')`;
const RESULTS_COUNT = `(SELECT COALESCE(value.float_value, value.int_value, value.double_value) FROM UNNEST(event_params) WHERE key = 'results_count')`;

function table(): string {
  return getEventsTableRef();
}

/** Normalize BQ event_date (YYYYMMDD string, DATE, or ISO) to YYYY-MM-DD for charts/API. */
export function formatBqEventDate(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    return formatBqEventDate((raw as { value: unknown }).value);
  }
  const s = String(raw).trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s.split('T')[0] ?? s;
}

export function overviewKpisSql(): string {
  return `
WITH base AS (
  SELECT
    event_name,
    user_pseudo_id,
    ${GA_SESSION} AS ga_session_id
  FROM ${table()}
  WHERE event_date BETWEEN @start_date AND @end_date
),
session_stats AS (
  SELECT
    user_pseudo_id,
    ga_session_id,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count
  FROM base
  WHERE ga_session_id IS NOT NULL
  GROUP BY user_pseudo_id, ga_session_id
)
SELECT
  (SELECT SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) FROM base) AS page_views,
  (SELECT COUNT(*) FROM session_stats) AS sessions,
  (SELECT COUNT(DISTINCT user_pseudo_id) FROM base) AS unique_users,
  (SELECT COUNTIF(pv_count = 1) FROM session_stats) AS bounced_sessions
`.trim();
}

export function overviewTimeseriesSql(): string {
  return `
SELECT
  event_date,
  COUNTIF(event_name = 'page_view') AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
GROUP BY event_date
ORDER BY event_date
`.trim();
}

/** Daily breakdown — aligned with bi/queries/events.py `home_line_chart_query`. */
export function overviewDailyMetricsSql(): string {
  return `
WITH base AS (
  SELECT
    event_date,
    event_name,
    user_pseudo_id,
    ${GA_SESSION} AS ga_session_id
  FROM ${table()}
  WHERE event_date BETWEEN @start_date AND @end_date
),
daily_sessions AS (
  SELECT
    event_date,
    COUNT(DISTINCT CONCAT(CAST(user_pseudo_id AS STRING), '-', CAST(ga_session_id AS STRING))) AS unique_sessions
  FROM base
  WHERE ga_session_id IS NOT NULL
  GROUP BY event_date
)
SELECT
  b.event_date,
  SUM(CASE WHEN b.event_name = 'page_view' THEN 1 ELSE 0 END) AS page_views,
  COALESCE(ds.unique_sessions, 0) AS unique_sessions,
  COUNT(DISTINCT b.user_pseudo_id) AS unique_users,
  SUM(CASE WHEN b.event_name = 'view_item' THEN 1 ELSE 0 END) AS product_views,
  SUM(CASE WHEN b.event_name = 'affiliate_click' THEN 1 ELSE 0 END) AS affiliate_clicks
FROM base b
LEFT JOIN daily_sessions ds ON ds.event_date = b.event_date
GROUP BY b.event_date, ds.unique_sessions
ORDER BY b.event_date
`.trim();
}

export function trafficTimeseriesSql(): string {
  return overviewTimeseriesSql();
}

export function trafficTopPagesSql(): string {
  return `
SELECT
  ${PAGE_PATH} AS page_path,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
  AND ${PAGE_PATH} != ''
GROUP BY page_path
ORDER BY value DESC
LIMIT 15
`.trim();
}

export function trafficReferrersSql(): string {
  return `
SELECT
  COALESCE(traffic_source.source, '(direct)') AS name,
  COUNT(DISTINCT user_pseudo_id) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
GROUP BY name
ORDER BY value DESC
LIMIT 30
`.trim();
}

/** Acquisition medium (organic, referral, cpc, …) — distinct users on page_view. */
export function overviewTrafficMediumSql(): string {
  return `
SELECT
  COALESCE(NULLIF(TRIM(COALESCE(traffic_source.medium, '')), ''), '(none)') AS name,
  COUNT(DISTINCT user_pseudo_id) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
GROUP BY name
ORDER BY value DESC
LIMIT 12
`.trim();
}

/** Source + medium combinations (e.g. google / organic) — distinct users. */
export function overviewSourceMediumSql(): string {
  return `
SELECT
  CONCAT(
    COALESCE(NULLIF(TRIM(COALESCE(traffic_source.source, '')), ''), '(direct)'),
    ' / ',
    COALESCE(NULLIF(TRIM(COALESCE(traffic_source.medium, '')), ''), '(none)')
  ) AS name,
  COUNT(DISTINCT user_pseudo_id) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
GROUP BY traffic_source.source, traffic_source.medium
ORDER BY value DESC
LIMIT 14
`.trim();
}

export function trafficDevicesSql(): string {
  return `
SELECT
  COALESCE(device.category, 'unknown') AS name,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
GROUP BY name
ORDER BY value DESC
`.trim();
}

export function trafficCountriesSql(): string {
  return `
SELECT
  COALESCE(geo.country, 'unknown') AS name,
  COUNT(DISTINCT user_pseudo_id) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'page_view'
GROUP BY name
ORDER BY value DESC
LIMIT 15
`.trim();
}

export function searchTimeseriesSql(): string {
  return `
SELECT
  event_date,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'search'
GROUP BY event_date
ORDER BY event_date
`.trim();
}

export function searchTopSql(): string {
  return `
SELECT
  LOWER(TRIM(${SEARCH_TERM})) AS search_term,
  COUNT(*) AS cnt,
  AVG(${RESULTS_COUNT}) AS avg_results
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'search'
  AND TRIM(${SEARCH_TERM}) != ''
GROUP BY search_term
ORDER BY cnt DESC
LIMIT 50
`.trim();
}

export function affiliateByPlatformSql(): string {
  return `
SELECT
  COALESCE(NULLIF(TRIM(${PARAM_PLATFORM}), ''), 'unknown') AS name,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'affiliate_click'
GROUP BY name
ORDER BY value DESC
LIMIT 15
`.trim();
}

export function affiliateByClickSourceSql(): string {
  return `
SELECT
  COALESCE(NULLIF(TRIM(${CLICK_SOURCE}), ''), 'unknown') AS name,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'affiliate_click'
GROUP BY name
ORDER BY value DESC
LIMIT 15
`.trim();
}

export function affiliateTopProductsSql(): string {
  return `
SELECT
  ${ITEM_CODE} AS item_code,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'affiliate_click'
  AND ${ITEM_CODE} != ''
GROUP BY item_code
ORDER BY value DESC
LIMIT 15
`.trim();
}

export function affiliateTimeseriesSql(): string {
  return `
SELECT
  event_date,
  COUNT(*) AS value
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'affiliate_click'
GROUP BY event_date
ORDER BY event_date
`.trim();
}

export function productViewsByCodeSql(): string {
  return `
SELECT
  ${ITEM_CODE} AS item_code,
  COUNT(*) AS views
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'view_item'
  AND ${ITEM_CODE} != ''
GROUP BY item_code
ORDER BY views DESC
LIMIT 200
`.trim();
}

export function productClicksByCodeSql(): string {
  return `
SELECT
  ${ITEM_CODE} AS item_code,
  COUNT(*) AS clicks,
  ANY_VALUE(${PARAM_PLATFORM}) AS affiliate_platform
FROM ${table()}
WHERE event_date BETWEEN @start_date AND @end_date
  AND event_name = 'affiliate_click'
  AND ${ITEM_CODE} != ''
GROUP BY item_code
ORDER BY clicks DESC
LIMIT 200
`.trim();
}

export function pageViewsTotalSql(): string {
  return `
SELECT COUNT(*) AS total
FROM ${table()}
WHERE event_name = 'page_view'
  AND event_date BETWEEN @start_date AND @end_date
`.trim();
}

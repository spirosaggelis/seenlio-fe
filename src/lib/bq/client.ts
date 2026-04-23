import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';

/** GA4 export table — keep aligned with bi/config.py EVENTS_TABLE. */
export function getEventsTableRef(): string {
  const project = process.env.BQ_PROJECT_ID?.trim();
  const dataset = process.env.BQ_DATASET_ID?.trim();
  if (!project || !dataset) {
    throw new Error('BQ_PROJECT_ID and BQ_DATASET_ID must be set');
  }
  return `\`${project}.${dataset}.all_events_data\``;
}

export function isBqConfigured(): boolean {
  return Boolean(process.env.BQ_PROJECT_ID?.trim() && process.env.BQ_DATASET_ID?.trim());
}

/**
 * GA4 BigQuery export stores `event_date` as STRING `YYYYMMDD`.
 * ISO `YYYY-MM-DD` values do not compare correctly in SQL BETWEEN — convert here.
 */
export function ga4EventDateParams(fromIsoYyyyMmDd: string, toIsoYyyyMmDd: string): {
  start_date: string;
  end_date: string;
} {
  return {
    start_date: fromIsoYyyyMmDd.replace(/-/g, ''),
    end_date: toIsoYyyyMmDd.replace(/-/g, ''),
  };
}

let client: BigQuery | null = null;

function getClient(): BigQuery {
  if (!client) {
    const projectId = process.env.BQ_PROJECT_ID?.trim();
    const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
    if (json) {
      client = new BigQuery({
        projectId,
        credentials: JSON.parse(json) as Record<string, unknown>,
      });
    } else {
      const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
      if (keyPath) {
        const resolved = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
        if (existsSync(resolved)) {
          const raw = readFileSync(resolved, 'utf8');
          client = new BigQuery({
            projectId,
            credentials: JSON.parse(raw) as Record<string, unknown>,
          });
        } else {
          console.warn(
            `[bq] GOOGLE_APPLICATION_CREDENTIALS file not found: ${resolved} (cwd=${process.cwd()})`,
          );
          client = new BigQuery({ projectId });
        }
      } else {
        client = new BigQuery({ projectId });
      }
    }
  }
  return client;
}

/** Run a parameterized query. Params use @name placeholders in SQL (see bi BigQuery jobs). */
export async function runBqQuery<T = Record<string, unknown>>(
  query: string,
  params: Record<string, string | number | boolean | null>,
): Promise<T[]> {
  const bq = getClient();
  const [rows] = await bq.query({ query, params, location: process.env.BQ_LOCATION || undefined });
  return rows as T[];
}

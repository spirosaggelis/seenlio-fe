import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || '';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

async function strapiGet(path: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Strapi ${path}: ${res.status}`);
  return res.json();
}

export async function GET(): Promise<NextResponse> {
  try {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [targetsRes, jobLogsRes, videosRes, publishedRes, settingRes, categoriesRes] =
      await Promise.all([
        strapiGet(
          '/pipeline-targets?populate[0]=category&pagination[pageSize]=100&sort=createdAt:asc',
        ),
        strapiGet(
          `/job-logs?filters[jobType][$eq]=pipeline&sort=startedAt:desc&pagination[pageSize]=10`,
        ),
        strapiGet(
          `/videos?filters[createdAt][$gte]=${weekAgo}&filters[videoStatus][$in][0]=ready&filters[videoStatus][$in][1]=published&pagination[pageSize]=1&fields[0]=id`,
        ),
        strapiGet(
          `/publish-records?filters[publishedAt][$gte]=${weekAgo}&filters[publishStatus][$eq]=published&pagination[pageSize]=1&fields[0]=id`,
        ),
        strapiGet('/setting'),
        strapiGet('/categories?fields[0]=id&fields[1]=name&filters[isActive][$eq]=true&sort=name:asc&pagination[pageSize]=100'),
      ]);

    const targets = (targetsRes.data || []).map((t: Record<string, unknown>) => {
      const attrs = (t as Record<string, unknown>).attributes || t;
      return { id: t.documentId || t.id, ...attrs };
    });

    const recentRuns = (jobLogsRes.data || []).map((j: Record<string, unknown>) => {
      const attrs = (j as Record<string, unknown>).attributes || j;
      return { id: j.documentId || j.id, ...attrs };
    });

    const settingData = settingRes.data || {};
    const settingAttrs = settingData.attributes || settingData;

    const categories = (categoriesRes.data || []).map((c: Record<string, unknown>) => {
      const attrs = ((c as Record<string, unknown>).attributes || c) as Record<string, unknown>;
      return { id: c.documentId || c.id, name: attrs.name };
    });

    return NextResponse.json({
      targets,
      recentRuns,
      videosThisWeek: videosRes.meta?.pagination?.total ?? 0,
      publishedThisWeek: publishedRes.meta?.pagination?.total ?? 0,
      pipelineEnabled: settingAttrs.pipelineEnabled ?? false,
      pipelineIntervalMinutes: settingAttrs.pipelineIntervalMinutes ?? 30,
      categories,
    });
  } catch (error) {
    console.error('Pipeline dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline data' }, { status: 500 });
  }
}

'use client';

interface Run {
  id: string;
  jobId: string;
  jobStatus: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  result: {
    discovered?: number;
    approved?: number;
    rejected?: number;
    site_published?: number;
    videos_generated?: number;
    scheduled?: number;
    published?: number;
    errors?: number;
  };
  errorMessage?: string;
}

interface Props {
  runs: Run[];
}

export default function PipelineRunsClient({ runs }: Props) {
  return (
    <div className='bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]'>
      <div className='p-5 border-b border-[var(--border-subtle)]'>
        <h2 className='text-sm font-semibold text-[var(--fg-secondary)] uppercase tracking-wider'>
          Recent Pipeline Runs
        </h2>
      </div>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-xs text-[var(--fg-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]'>
              <th className='text-left px-5 py-3'>Time</th>
              <th className='text-center px-5 py-3'>Duration</th>
              <th className='text-center px-5 py-3'>Discovered</th>
              <th className='text-center px-5 py-3'>Approved</th>
              <th className='text-center px-5 py-3'>Rejected</th>
              <th className='text-center px-5 py-3'>Site Pub.</th>
              <th className='text-center px-5 py-3'>Videos</th>
              <th className='text-center px-5 py-3'>Scheduled</th>
              <th className='text-center px-5 py-3'>Published</th>
              <th className='text-center px-5 py-3'>Errors</th>
              <th className='text-center px-5 py-3'>Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr>
                <td colSpan={11} className='px-5 py-8 text-center text-[var(--fg-muted)]'>
                  No pipeline runs yet.
                </td>
              </tr>
            )}
            {runs.map((run) => {
              const result = run.result || {};
              const durationSec = Math.round((run.duration || 0) / 1000);
              return (
                <tr
                  key={run.id}
                  className='border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors'
                >
                  <td className='px-5 py-3 text-[var(--fg-primary)]'>
                    {new Date(run.startedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className='px-5 py-3 text-center text-[var(--fg-muted)]'>
                    {durationSec < 60 ? `${durationSec}s` : `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`}
                  </td>
                  <td className='px-5 py-3 text-center'>{result.discovered ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>{result.approved ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>
                    {(result.rejected ?? 0) > 0 ? (
                      <span className='text-orange-400'>{result.rejected}</span>
                    ) : (
                      <span className='text-[var(--fg-muted)]'>{result.rejected ?? '-'}</span>
                    )}
                  </td>
                  <td className='px-5 py-3 text-center'>{result.site_published ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>{result.videos_generated ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>{result.scheduled ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>{result.published ?? '-'}</td>
                  <td className='px-5 py-3 text-center'>
                    {(result.errors ?? 0) > 0 ? (
                      <span className='text-red-400'>{result.errors}</span>
                    ) : (
                      <span className='text-[var(--fg-muted)]'>0</span>
                    )}
                  </td>
                  <td className='px-5 py-3 text-center'>
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        run.jobStatus === 'completed'
                          ? 'bg-green-500/20 text-green-300'
                          : run.jobStatus === 'failed'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-yellow-500/20 text-yellow-300',
                      ].join(' ')}
                    >
                      {run.jobStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

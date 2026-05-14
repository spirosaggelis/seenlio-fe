import { spawn } from 'node:child_process';
import path from 'node:path';

/**
 * Resolve the orchestrator venv + repo root.
 *
 * Defaults assume the standard layout: the repo lives at
 * `/home/mamra/repos/viral-products` and each service has its own
 * `.venv` (matches `services/ecosystem.config.js`). Override via
 * env vars when running elsewhere (CI, docker).
 */
const REPO_ROOT =
  process.env.SEENLIO_REPO_ROOT || path.resolve(process.cwd(), '..');
const ORCH_DIR = path.join(REPO_ROOT, 'services', 'orchestrator');
const ORCH_PYTHON =
  process.env.SEENLIO_ORCH_PYTHON ||
  path.join(ORCH_DIR, '.venv', 'bin', 'python');

export interface RunnerResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  parsed?: Record<string, unknown>;
}

/**
 * Spawn the listicles CLI and resolve when it exits.
 * Hard cap at 5 minutes — plan + generate both stay well below that, but a
 * stuck OpenAI request shouldn't pin the Next.js server.
 */
export async function runListiclesCli(
  args: string[],
  timeoutMs = 5 * 60 * 1000,
): Promise<RunnerResult> {
  return new Promise((resolve) => {
    const child = spawn(ORCH_PYTHON, ['-m', 'orchestrator.listicles', ...args], {
      cwd: ORCH_DIR,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString()));

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr: stderr + `\nspawn error: ${String(err)}`,
        exitCode: null,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      let parsed: Record<string, unknown> | undefined;
      // The CLI prints one JSON line on success. Take the last non-empty line.
      const lastLine = stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .pop();
      if (lastLine && lastLine.startsWith('{')) {
        try {
          parsed = JSON.parse(lastLine) as Record<string, unknown>;
        } catch {
          /* fall through */
        }
      }
      resolve({
        ok: !killed && code === 0,
        stdout,
        stderr: killed ? stderr + '\n[killed: timeout]' : stderr,
        exitCode: code,
        parsed,
      });
    });
  });
}

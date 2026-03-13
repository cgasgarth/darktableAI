#!/usr/bin/env bun

import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { validateLiveSmoke } from "./validate-live-session-support";

const PROJECT_ROOT = path.resolve(import.meta.dir, "..");
const SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/validate-live-session.ts");
const FIXTURE_ASSET_PATH = path.resolve(PROJECT_ROOT, "assets/_DSC8809.ARW");
const LIVE_BRIDGE_PATH = path.resolve(PROJECT_ROOT, "../darktable/build/bin/darktable-live-bridge");
const REQUESTED_EXPOSURE = 1.25;
const TOTAL_TIMEOUT_MS = 15_000;
const READY_TIMEOUT_MS = 8_000;
const READY_POLL_INTERVAL_MS = 1_000;
const SET_TIMEOUT_MS = 1_500;
const SET_POLL_INTERVAL_MS = 100;
const CLI_COMMAND_TIMEOUT_MS = 5_000;
const TMUX_COMMAND_TIMEOUT_MS = 3_000;
const FLOAT_TOLERANCE = 0.000_001;

const invokedInternally = Bun.argv.includes("--internal-dbus-session");

try {
  if (!invokedInternally) {
    await rerunInsideDbusSession();
  }

  const result = await runValidation();
  console.log(JSON.stringify(result));
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : "Unknown live validation failure.");
  process.exit(1);
}

async function rerunInsideDbusSession(): Promise<never> {
  const processResult = Bun.spawn({
    cmd: [
      "dbus-run-session",
      "--",
      "timeout",
      "--signal=KILL",
      `${String(Math.ceil(TOTAL_TIMEOUT_MS / 1000))}s`,
      "bun",
      SCRIPT_PATH,
      "--internal-dbus-session"
    ],
    cwd: PROJECT_ROOT,
    env: process.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  });

  process.exit(await processResult.exited);
}

async function runValidation(): Promise<Record<string, unknown>> {
  const runtimeRoot = await mkdtemp(path.join(tmpdir(), "darktableai-live-smoke-"));
  const configDirectory = path.join(runtimeRoot, "config");
  const cacheDirectory = path.join(runtimeRoot, "cache");
  const temporaryDirectory = path.join(runtimeRoot, "tmp");
  const runtimeDirectory = path.join(runtimeRoot, "runtime");
  const isolatedAssetPath = path.join(runtimeRoot, path.basename(FIXTURE_ASSET_PATH));
  const libraryPath = path.join(runtimeRoot, "library.db");
  const darktableLogPath = path.join(runtimeRoot, "darktable.log");
  const tmuxSocketName = `darktableai-live-${String(process.pid)}`;
  const tmuxSessionName = `darktableai-live-${String(process.pid)}`;

  await Promise.all([
    mkdir(configDirectory, { recursive: true }),
    mkdir(cacheDirectory, { recursive: true }),
    mkdir(temporaryDirectory, { recursive: true }),
    mkdir(runtimeDirectory, { recursive: true })
  ]);
  await copyFile(FIXTURE_ASSET_PATH, isolatedAssetPath);

  const darktableCommand = [
    "export NO_AT_BRIDGE=1",
    "export GDK_BACKEND=x11",
    "export GIO_USE_VFS=local",
    "export GVFS_DISABLE_FUSE=1",
    `export XDG_RUNTIME_DIR='${runtimeDirectory}'`,
    `exec xvfb-run -a /usr/bin/darktable '${isolatedAssetPath}' --configdir '${configDirectory}' --cachedir '${cacheDirectory}' --library '${libraryPath}' --disable-opencl --tmpdir '${temporaryDirectory}' >'${darktableLogPath}' 2>&1`
  ].join(" && ");

  try {
    await runQuickCommand(
      [
        "tmux",
        "-L",
        tmuxSocketName,
        "new-session",
        "-d",
        "-s",
        tmuxSessionName,
        "bash",
        "-lc",
        darktableCommand
      ],
      TMUX_COMMAND_TIMEOUT_MS,
      "start tmux darktable host"
    );

    const firstSession = await waitForLiveSession();
    const mutation = await runCliCommand([
      "live-set-exposure",
      "--exposure",
      String(REQUESTED_EXPOSURE),
      "--timeout-ms",
      String(SET_TIMEOUT_MS),
      "--poll-interval-ms",
      String(SET_POLL_INTERVAL_MS)
    ]);
    const secondSession = await runCliCommand(["live-session-info"]);
    const outcome = validateLiveSmoke({
      firstSession,
      mutation,
      secondSession,
      assetPath: isolatedAssetPath,
      liveBridgePath: LIVE_BRIDGE_PATH,
      requestedExposure: REQUESTED_EXPOSURE,
      setTimeoutMilliseconds: SET_TIMEOUT_MS,
      setPollIntervalMilliseconds: SET_POLL_INTERVAL_MS,
      floatTolerance: FLOAT_TOLERANCE
    });

    return {
      status: "ok",
      mode: outcome.mode,
      note: outcome.note,
      assetPath: isolatedAssetPath,
      runtime: {
        configDirectory,
        cacheDirectory,
        temporaryDirectory,
        libraryPath,
        darktableLogPath,
        tmuxSocketName,
        tmuxSessionName
      }
    };
  } finally {
    await runQuickCommand(
      ["tmux", "-L", tmuxSocketName, "kill-session", "-t", tmuxSessionName],
      TMUX_COMMAND_TIMEOUT_MS,
      "kill tmux darktable session",
      true
    );
    await runQuickCommand(
      ["tmux", "-L", tmuxSocketName, "kill-server"],
      TMUX_COMMAND_TIMEOUT_MS,
      "kill tmux server",
      true
    );
    await rm(runtimeRoot, { force: true, recursive: true });
  }
}

async function waitForLiveSession(): Promise<JsonRecord> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let latestError: string | undefined;

  while (Date.now() < deadline) {
    try {
      return await runCliCommand(["live-session-info"]);
    } catch (error: unknown) {
      latestError = error instanceof Error ? error.message : "Unknown live-session-info failure.";
      await sleep(READY_POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `Timed out waiting ${String(READY_TIMEOUT_MS)}ms for a live darktable session.` +
      (latestError === undefined ? "" : ` Last error: ${latestError}`)
  );
}

async function runCliCommand(arguments_: ReadonlyArray<string>): Promise<JsonRecord> {
  const processResult = Bun.spawn({
    cmd: [
      "timeout",
      "--signal=KILL",
      `${String(Math.ceil(CLI_COMMAND_TIMEOUT_MS / 1000))}s`,
      "bun",
      "run",
      "--silent",
      "cli",
      "--",
      ...arguments_
    ],
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      GIO_USE_VFS: "local",
      GVFS_DISABLE_FUSE: "1",
      DARKTABLE_LIVE_BRIDGE_PATH: LIVE_BRIDGE_PATH
    },
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdoutText, stderrText, exitCode] = await Promise.all([
    readRequiredStream(processResult.stdout),
    readRequiredStream(processResult.stderr),
    waitForExit(processResult.exited, CLI_COMMAND_TIMEOUT_MS, `cli command '${arguments_.join(" ")}'`)
  ]);

  if (exitCode !== 0) {
    throw new Error(
      [
        `Command 'bun run --silent cli -- ${arguments_.join(" ")}' failed with code ${String(exitCode)}.`,
        formatCapturedOutput("stdout", stdoutText),
        formatCapturedOutput("stderr", stderrText)
      ].join("\n")
    );
  }

  const parsed = JSON.parse(stdoutText) as unknown;
  if (!isRecord(parsed)) {
    throw new Error(`Command '${arguments_.join(" ")}' did not return a JSON object.`);
  }

  return parsed;
}

async function runQuickCommand(
  command: ReadonlyArray<string>,
  timeoutMilliseconds: number,
  label: string,
  allowFailure = false
): Promise<void> {
  const processResult = Bun.spawn({
    cmd: [...command],
    cwd: PROJECT_ROOT,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdoutText, stderrText, exitCode] = await Promise.all([
    readRequiredStream(processResult.stdout),
    readRequiredStream(processResult.stderr),
    waitForExit(processResult.exited, timeoutMilliseconds, label)
  ]);

  if (exitCode !== 0 && !allowFailure) {
    throw new Error(
      [
        `${label} failed with code ${String(exitCode)}.`,
        formatCapturedOutput("stdout", stdoutText),
        formatCapturedOutput("stderr", stderrText)
      ].join("\n")
    );
  }
}

async function readRequiredStream(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (stream === null) {
    throw new Error("Expected process stream to be available.");
  }

  return await new Response(stream).text();
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForExit(
  exitPromise: Promise<number>,
  timeoutMilliseconds: number,
  label: string
): Promise<number> {
  return await Promise.race([
    exitPromise,
    new Promise<number>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${String(timeoutMilliseconds)}ms.`));
      }, timeoutMilliseconds);
    })
  ]);
}

function formatCapturedOutput(label: string, output: string): string {
  const trimmedOutput = output.trim();
  return `${label}: ${trimmedOutput.length === 0 ? "<empty>" : trimmedOutput}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type JsonRecord = Record<string, unknown>;

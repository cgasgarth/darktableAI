import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("darktableai live commands", () => {
  const tempDirectories: Array<string> = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("prints JSON-only stdout for live-session-info unavailable responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"get-session\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"unsupported-view\"}'",
        "  exit 0",
        "fi",
        "printf '%s' 'unexpected command' >&2",
        "exit 4"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: ["bun", "run", "src/bin/darktableai.ts", "live-session-info"],
      cwd: projectRoot,
      env: {
        ...process.env,
        DARKTABLE_LIVE_BRIDGE_PATH: helperPath
      },
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stderr.toString()).toBe("");
    expect(JSON.parse(processResult.stdout.toString())).toMatchObject({
      status: "unavailable",
      reason: "unsupported-view",
      diagnostics: {
        helperBinaryPath: helperPath,
        commandArguments: [helperPath, "get-session"],
        exitCode: 0
      }
    });
  });

  test("prints JSON-only stdout for live-set-exposure wait flow", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");
    const statePath = path.join(tempDirectory, "state");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        `STATE_PATH='${statePath}'`,
        "COMMAND=\"$1\"",
        "if [ \"${COMMAND}\" = \"set-exposure\" ]; then",
        "  printf '1' > \"${STATE_PATH}\"",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":4,\"historyChangeSequence\":2,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"exposure\":{\"previous\":0,\"requested\":0.5,\"current\":0.5,\"requestedRenderSequence\":5}}'",
        "  exit 0",
        "fi",
        "COUNT=0",
        "if [ -f \"${STATE_PATH}\" ]; then COUNT=$(cat \"${STATE_PATH}\"); fi",
        "if [ \"${COUNT}\" = \"0\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":4,\"historyChangeSequence\":2,\"imageLoadSequence\":1},\"exposure\":{\"current\":0}}'",
        "  exit 0",
        "fi",
        "printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":5,\"historyChangeSequence\":2,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"exposure\":{\"current\":0.5}}'",
        "exit 0"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: [
        "bun",
        "run",
        "src/bin/darktableai.ts",
        "live-set-exposure",
        "--exposure",
        "0.5",
        "--timeout-ms",
        "50",
        "--poll-interval-ms",
        "1"
      ],
      cwd: projectRoot,
      env: {
        ...process.env,
        DARKTABLE_LIVE_BRIDGE_PATH: helperPath
      },
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stderr.toString()).toBe("");

    expect(JSON.parse(processResult.stdout.toString())).toMatchObject({
      status: "ok",
      session: {
        renderSequence: 5
      },
      setExposure: {
        requested: 0.5,
        requestedRenderSequence: 5
      },
      wait: {
        mode: "until-render",
        completed: true,
        timedOut: false,
        targetRenderSequence: 5
      }
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

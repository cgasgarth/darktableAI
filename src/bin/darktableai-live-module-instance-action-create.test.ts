import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("darktableai live module-instance action create/duplicate", () => {
  const tempDirectories: Array<string> = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("prints JSON-only stdout for live-module-instance-action create responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"apply-module-instance-action\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"exposure#0#0#\",\"action\":\"create\",\"resultInstanceKey\":\"exposure#0#1#1\",\"moduleOp\":\"exposure\",\"iopOrder\":12,\"multiPriority\":1,\"multiName\":\"1\",\"historyBefore\":2,\"historyAfter\":3,\"requestedHistoryEnd\":3},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#1#1\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":1,\"multiName\":\"1\",\"blend\":{\"supported\":false,\"masksSupported\":false},\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"exposure#0#1#1\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":1,\"multiName\":\"1\",\"blend\":{\"supported\":false,\"masksSupported\":false},\"params\":{\"encoding\":\"unsupported\"}}]}}'",
        "  exit 0",
        "fi",
        "printf '%s' 'unexpected command' >&2",
        "exit 4"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: [
        "bun",
        "run",
        "src/bin/darktableai.ts",
        "live-module-instance-action",
        "--instance-key",
        "exposure#0#0#",
        "--action",
        "create"
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
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [helperPath, "apply-module-instance-action", "exposure#0#0#", "create"],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        action: "create",
        resultInstanceKey: "exposure#0#1#1"
      },
      snapshot: {
        moduleStack: [
          {
            instanceKey: "exposure#0#1#1",
            enabled: true
          }
        ]
      }
    });
  });

  test("prints JSON-only stdout for unavailable duplicate responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"apply-module-instance-action\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"unsupported-module-state\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"temperature#0#0#\",\"action\":\"duplicate\",\"moduleOp\":\"temperature\",\"iopOrder\":6,\"multiPriority\":0,\"multiName\":\"0\",\"historyBefore\":2,\"historyAfter\":2,\"requestedHistoryEnd\":2}}'",
        "  exit 0",
        "fi",
        "printf '%s' 'unexpected command' >&2",
        "exit 4"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: [
        "bun",
        "run",
        "src/bin/darktableai.ts",
        "live-module-instance-action",
        "--instance-key",
        "temperature#0#0#",
        "--action",
        "duplicate"
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
      status: "unavailable",
      reason: "unsupported-module-state",
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [helperPath, "apply-module-instance-action", "temperature#0#0#", "duplicate"],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "temperature#0#0#",
        action: "duplicate",
        moduleOp: "temperature"
      }
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

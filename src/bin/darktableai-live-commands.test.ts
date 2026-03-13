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

  test("prints JSON-only stdout for live-session-snapshot responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"get-snapshot\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"snapshot\":{\"appliedHistoryEnd\":3,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}},{\"index\":1,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}},{\"index\":2,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}}]}}'",
        "  exit 0",
        "fi",
        "printf '%s' 'unexpected command' >&2",
        "exit 4"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: ["bun", "run", "src/bin/darktableai.ts", "live-session-snapshot"],
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
      diagnostics: {
        helperBinaryPath: helperPath,
        commandArguments: [helperPath, "get-snapshot"],
        exitCode: 0
      },
      snapshot: {
        appliedHistoryEnd: 3,
        controls: [
          {
            id: "exposure.exposure",
            value: 0.25
          }
        ]
      }
    });
  });

  test("prints JSON-only stdout for live-session-snapshot unavailable responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"get-snapshot\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"unsupported-view\",\"session\":{\"view\":\"lighttable\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1}}'",
        "  exit 0",
        "fi",
        "printf '%s' 'unexpected command' >&2",
        "exit 4"
      ].join("\n")
    );

    const processResult = Bun.spawnSync({
      cmd: ["bun", "run", "src/bin/darktableai.ts", "live-session-snapshot"],
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
      session: {
        view: "lighttable"
      },
      diagnostics: {
        helperBinaryPath: helperPath,
        commandArguments: [helperPath, "get-snapshot"],
        exitCode: 0
      }
    });
  });

  test("prints JSON-only stdout for live-module-instance-action responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"exposure#0#0#\",\"requestedEnabled\":false,\"moduleOp\":\"exposure\",\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"action\":\"disable\",\"previousEnabled\":true,\"currentEnabled\":false,\"changed\":true,\"historyBefore\":2,\"historyAfter\":3,\"requestedHistoryEnd\":3},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":false,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":false,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}}]}}'",
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
        "disable"
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
          commandArguments: [helperPath, "apply-module-instance-action", "exposure#0#0#", "disable"],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        action: "disable",
        currentEnabled: false
      },
      snapshot: {
        moduleStack: [
          {
            instanceKey: "exposure#0#0#",
            enabled: false
          }
        ]
      }
    });
  });

  test("prints JSON-only stdout for unavailable live-module-instance-action responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"unsupported-module-state\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"exposure#0#0#\",\"action\":\"disable\",\"requestedEnabled\":false}}'",
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
        "disable"
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
          commandArguments: [helperPath, "apply-module-instance-action", "exposure#0#0#", "disable"],
          exitCode: 0
        }
      ],
      activeImage: {
        sourceAssetPath: "/photos/frame.ARW"
      },
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        action: "disable",
        requestedEnabled: false
      }
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("darktableai live module-instance action reorder", () => {
  const tempDirectories: Array<string> = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("prints JSON-only stdout for move-after responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"colorbalancergb#0#1#mask\",\"action\":\"move-after\",\"anchorInstanceKey\":\"exposure#0#0#\",\"moduleOp\":\"colorbalancergb\",\"iopOrder\":8,\"multiPriority\":1,\"multiName\":\"mask\",\"previousIopOrder\":14,\"currentIopOrder\":8,\"historyBefore\":4,\"historyAfter\":5,\"requestedHistoryEnd\":5},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"blend\":{\"supported\":false,\"masksSupported\":false},\"params\":{\"encoding\":\"unsupported\"}},{\"instanceKey\":\"colorbalancergb#0#1#mask\",\"moduleOp\":\"colorbalancergb\",\"enabled\":true,\"iopOrder\":8,\"multiPriority\":1,\"multiName\":\"mask\",\"blend\":{\"supported\":false,\"masksSupported\":false},\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"colorbalancergb#0#1#mask\",\"moduleOp\":\"colorbalancergb\",\"enabled\":true,\"iopOrder\":8,\"multiPriority\":1,\"multiName\":\"mask\",\"blend\":{\"supported\":false,\"masksSupported\":false},\"params\":{\"encoding\":\"unsupported\"}}]}}'",
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
        "colorbalancergb#0#1#mask",
        "--action",
        "move-after",
        "--anchor-instance-key",
        "exposure#0#0#"
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
    const parsed = JSON.parse(processResult.stdout.toString()) as {
      readonly status: string;
      readonly diagnostics: ReadonlyArray<{
        readonly helperBinaryPath: string;
        readonly commandArguments: ReadonlyArray<string>;
        readonly exitCode: number;
      }>;
      readonly moduleAction: {
        readonly targetInstanceKey: string;
        readonly action: string;
        readonly anchorInstanceKey: string;
        readonly previousIopOrder: number;
        readonly currentIopOrder: number;
      };
      readonly snapshot: {
        readonly moduleStack: ReadonlyArray<{
          readonly instanceKey: string;
          readonly iopOrder: number;
        }>;
      };
    };

    expect(parsed).toMatchObject({
      status: "ok",
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [
            helperPath,
            "apply-module-instance-action",
            "colorbalancergb#0#1#mask",
            "move-after",
            "exposure#0#0#"
          ],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "colorbalancergb#0#1#mask",
        action: "move-after",
        anchorInstanceKey: "exposure#0#0#",
        previousIopOrder: 14,
        currentIopOrder: 8
      }
    });
    expect(parsed.snapshot.moduleStack.at(-1)).toMatchObject({
      instanceKey: "colorbalancergb#0#1#mask",
      iopOrder: 8
    });
  });

  test("prints JSON-only stdout for unavailable move-after responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"unknown-anchor-instance-key\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"colorbalancergb#0#1#mask\",\"action\":\"move-after\",\"anchorInstanceKey\":\"missing#-1#-1#anchor\",\"previousIopOrder\":14,\"currentIopOrder\":14,\"historyBefore\":5,\"historyAfter\":5,\"requestedHistoryEnd\":5}}'",
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
        "colorbalancergb#0#1#mask",
        "--action",
        "move-after",
        "--anchor-instance-key",
        "missing#-1#-1#anchor"
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
      reason: "unknown-anchor-instance-key",
      moduleAction: {
        targetInstanceKey: "colorbalancergb#0#1#mask",
        action: "move-after",
        anchorInstanceKey: "missing#-1#-1#anchor",
        previousIopOrder: 14,
        currentIopOrder: 14
      },
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [
            helperPath,
            "apply-module-instance-action",
            "colorbalancergb#0#1#mask",
            "move-after",
            "missing#-1#-1#anchor"
          ],
          exitCode: 0
        }
      ]
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

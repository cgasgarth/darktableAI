import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("darktableai live module-instance action delete", () => {
  const tempDirectories: Array<string> = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("prints JSON-only stdout for live-module-instance-action delete responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"colorbalancergb#7#1#mask\",\"action\":\"delete\",\"moduleOp\":\"colorbalancergb\",\"iopOrder\":8,\"multiPriority\":1,\"multiName\":\"mask\",\"historyBefore\":6,\"historyAfter\":5,\"requestedHistoryEnd\":5,\"replacementInstanceKey\":\"colorbalancergb#8#2#replacement\",\"replacementIopOrder\":9,\"replacementMultiPriority\":2,\"replacementMultiName\":\"replacement\"},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"params\":{\"encoding\":\"unsupported\"}},{\"instanceKey\":\"colorbalancergb#8#2#replacement\",\"moduleOp\":\"colorbalancergb\",\"enabled\":true,\"iopOrder\":9,\"multiPriority\":2,\"multiName\":\"replacement\",\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"colorbalancergb#8#2#replacement\",\"moduleOp\":\"colorbalancergb\",\"enabled\":true,\"iopOrder\":9,\"multiPriority\":2,\"multiName\":\"replacement\",\"params\":{\"encoding\":\"unsupported\"}}]}}'",
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
        "colorbalancergb#7#1#mask",
        "--action",
        "delete"
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
        readonly replacementInstanceKey: string;
      };
      readonly snapshot: {
        readonly moduleStack: ReadonlyArray<{
          readonly instanceKey: string;
          readonly enabled: boolean;
        }>;
      };
    };

    expect(parsed).toMatchObject({
      status: "ok",
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [helperPath, "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "colorbalancergb#7#1#mask",
        action: "delete",
        replacementInstanceKey: "colorbalancergb#8#2#replacement"
      }
    });
    expect(parsed.snapshot.moduleStack.at(-1)).toMatchObject({
      instanceKey: "colorbalancergb#8#2#replacement",
      enabled: true
    });
  });

  test("prints JSON-only stdout for unavailable delete responses", () => {
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
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"unavailable\",\"reason\":\"module-delete-blocked-last-instance\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleAction\":{\"targetInstanceKey\":\"colorbalancergb#7#1#mask\",\"action\":\"delete\",\"moduleOp\":\"colorbalancergb\",\"iopOrder\":8,\"multiPriority\":1,\"multiName\":\"mask\",\"historyBefore\":6,\"historyAfter\":6,\"requestedHistoryEnd\":6}}'",
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
        "colorbalancergb#7#1#mask",
        "--action",
        "delete"
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
      reason: "module-delete-blocked-last-instance",
      diagnostics: [
        {
          helperBinaryPath: helperPath,
          commandArguments: [helperPath, "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
          exitCode: 0
        }
      ],
      moduleAction: {
        targetInstanceKey: "colorbalancergb#7#1#mask",
        action: "delete",
        moduleOp: "colorbalancergb"
      }
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

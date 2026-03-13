import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

describe("darktableai live-set-module-blend", () => {
  const tempDirectories: Array<string> = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("prints JSON-only stdout for successful blend responses", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const tempDirectory = mkdtempSync(path.join(tmpdir(), "darktableai-live-cli-"));
    tempDirectories.push(tempDirectory);
    const helperPath = path.join(tempDirectory, "darktable-live-bridge");

    writeExecutable(
      helperPath,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "if [ \"$1\" = \"apply-module-instance-blend\" ]; then",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleBlend\":{\"targetInstanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"previousOpacity\":100,\"requestedOpacity\":75,\"currentOpacity\":75,\"historyBefore\":2,\"historyAfter\":3,\"requestedHistoryEnd\":3},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"blend\":{\"supported\":true,\"masksSupported\":true,\"opacity\":75,\"blendMode\":\"normal\",\"reverseOrder\":false},\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"blend\":{\"supported\":true,\"masksSupported\":true,\"opacity\":75,\"blendMode\":\"normal\",\"reverseOrder\":false},\"params\":{\"encoding\":\"unsupported\"}}]}}'",
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
        "live-set-module-blend",
        "--instance-key",
        "exposure#0#0#",
        "--opacity",
        "75"
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
          commandArguments: [helperPath, "apply-module-instance-blend", "exposure#0#0#", '{"opacity":75}'],
          exitCode: 0
        }
      ],
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        currentOpacity: 75
      },
      snapshot: {
        moduleStack: [
          {
            blend: {
              supported: true,
              opacity: 75
            }
          }
        ]
      }
    });
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

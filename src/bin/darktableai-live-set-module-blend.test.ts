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

  test("supports blend mode and reverse order arguments end to end", () => {
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
        "  if [ \"$3\" != '{\"blendMode\":\"multiply\",\"reverseOrder\":true}' ]; then",
        "    printf '%s' \"unexpected payload: $3\" >&2",
        "    exit 9",
        "  fi",
        "  printf '%s' '{\"bridgeVersion\":1,\"status\":\"ok\",\"session\":{\"view\":\"darkroom\",\"renderSequence\":8,\"historyChangeSequence\":4,\"imageLoadSequence\":1},\"activeImage\":{\"imageId\":7,\"directoryPath\":\"/photos\",\"fileName\":\"frame.ARW\",\"sourceAssetPath\":\"/photos/frame.ARW\"},\"moduleBlend\":{\"targetInstanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"previousBlendMode\":\"normal\",\"requestedBlendMode\":\"multiply\",\"currentBlendMode\":\"multiply\",\"previousReverseOrder\":false,\"requestedReverseOrder\":true,\"currentReverseOrder\":true,\"historyBefore\":2,\"historyAfter\":3,\"requestedHistoryEnd\":3},\"snapshot\":{\"appliedHistoryEnd\":1,\"controls\":[{\"id\":\"exposure.exposure\",\"module\":\"exposure\",\"control\":\"exposure\",\"operations\":[\"get\",\"set\"],\"requires\":{\"activeImage\":true,\"view\":\"darkroom\"},\"valueType\":{\"type\":\"number\",\"minimum\":-3,\"maximum\":4},\"value\":0.25}],\"moduleStack\":[{\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"blend\":{\"supported\":true,\"masksSupported\":true,\"opacity\":75,\"blendMode\":\"multiply\",\"reverseOrder\":true},\"params\":{\"encoding\":\"unsupported\"}}],\"historyItems\":[{\"index\":0,\"applied\":true,\"instanceKey\":\"exposure#0#0#\",\"moduleOp\":\"exposure\",\"enabled\":true,\"iopOrder\":12,\"multiPriority\":0,\"multiName\":\"0\",\"blend\":{\"supported\":true,\"masksSupported\":true,\"opacity\":75,\"blendMode\":\"multiply\",\"reverseOrder\":true},\"params\":{\"encoding\":\"unsupported\"}}]}}'",
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
        "--blend-mode",
        "multiply",
        "--reverse-order",
        "true"
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
          commandArguments: [
            helperPath,
            "apply-module-instance-blend",
            "exposure#0#0#",
            '{"blendMode":"multiply","reverseOrder":true}'
          ],
          exitCode: 0
        }
      ],
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        currentBlendMode: "multiply",
        currentReverseOrder: true
      },
      snapshot: {
        moduleStack: [
          {
            blend: {
              blendMode: "multiply",
              reverseOrder: true
            }
          }
        ]
      }
    });
  });

  test("prints a CLI error when no blend fields are requested", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");

    const processResult = Bun.spawnSync({
      cmd: [
        "bun",
        "run",
        "src/bin/darktableai.ts",
        "live-set-module-blend",
        "--instance-key",
        "exposure#0#0#"
      ],
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(processResult.exitCode).toBe(1);
    expect(processResult.stdout.toString()).toBe("");
    expect(processResult.stderr.toString().trim()).toBe(
      "Command 'live-set-module-blend' requires at least one of '--opacity', '--blend-mode', or '--reverse-order'."
    );
  });

  test("documents blend mode and reverse order options in help output", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");

    const processResult = Bun.spawnSync({
      cmd: ["bun", "run", "src/bin/darktableai.ts", "help"],
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stderr.toString()).toBe("");
    const stdout = processResult.stdout.toString();
    expect(stdout).toContain(
      "bun run cli -- live-set-module-blend --instance-key <key> --blend-mode <machine-name>"
    );
    expect(stdout).toContain(
      "bun run cli -- live-set-module-blend --instance-key <key> --reverse-order <true|false>"
    );
    expect(stdout).toContain(
      "bun run cli -- live-set-module-blend --instance-key colorbalancergb#7#1# --opacity 62 --blend-mode softlight --reverse-order false"
    );
  });
});

function writeExecutable(filePath: string, content: string): void {
  writeFileSync(filePath, content);
  chmodSync(filePath, 0o755);
}

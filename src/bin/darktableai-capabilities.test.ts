import { describe, expect, test } from "bun:test";
import path from "node:path";

import { listAdjustmentCapabilities } from "../contracts/adjustment-capability";
import { listDarktableNativeCapabilities } from "../contracts/darktable-native-capability";

describe("darktableai capabilities command", () => {
  test("prints JSON-only capability data to stdout", () => {
    const projectRoot = path.resolve(import.meta.dir, "..", "..");
    const processResult = Bun.spawnSync({
      cmd: ["bun", "run", "src/bin/darktableai.ts", "capabilities"],
      cwd: projectRoot,
      stderr: "pipe",
      stdout: "pipe"
    });

    expect(processResult.exitCode).toBe(0);
    expect(processResult.stderr.toString()).toBe("");

    const stdout = processResult.stdout.toString().trim();
    const parsed = JSON.parse(stdout) as {
      adjustments: Record<string, unknown>;
      darktableNative: Record<string, unknown>;
    };

    expect(parsed).toEqual({
      adjustments: listAdjustmentCapabilities(),
      darktableNative: listDarktableNativeCapabilities()
    });
  });
});

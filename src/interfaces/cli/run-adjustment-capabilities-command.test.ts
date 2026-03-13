import { describe, expect, test } from "bun:test";

import { listAdjustmentCapabilities } from "../../contracts/adjustment-capability";
import { listDarktableNativeCapabilities } from "../../contracts/darktable-native-capability";
import { RunAdjustmentCapabilitiesCommand } from "./run-adjustment-capabilities-command";

describe("RunAdjustmentCapabilitiesCommand", () => {
  test("returns the adjustment capability registry as machine-readable JSON payload data", async () => {
    const command = new RunAdjustmentCapabilitiesCommand();

    const result = await command.execute({});

    expect(result).toEqual({
      ok: true,
      output: {
        adjustments: listAdjustmentCapabilities(),
        darktableNative: listDarktableNativeCapabilities()
      }
    });
  });
});

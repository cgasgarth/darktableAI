import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: [
    "/opt/darktable/build/bin/darktable-live-bridge",
    "apply-module-instance-blend",
    "exposure#0#0#",
    '{"opacity":75}'
  ],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser module blend errors", (): void => {
  test("rejects unavailable module blend payloads with impossible reasons", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unsupported-module-action",
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            requestedOpacity: 75
          }
        }),
        diagnostics
      )
    ).toThrow(
      "darktable-live-bridge field 'reason' must be 'unsupported-view', 'no-active-image', 'unknown-instance-key', 'unsupported-module-blend', 'unsupported-module-blend-mode', 'module-blend-failed', or 'snapshot-unavailable' for module blend responses."
    );
  });

  test("rejects unavailable module blend payloads without moduleBlend context", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unsupported-module-blend"
        }),
        diagnostics
      )
    ).toThrow("darktable-live-bridge field 'moduleBlend' must be an object.");
  });
});

import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

describe("DarktableLiveBridgeResponseParser module mask", (): void => {
  test("parses successful module mask mutations", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    const result = parser.parseApplyModuleInstanceMask(
      JSON.stringify(createPayload("ok")),
      createDiagnostics()
    );

    if (result.status !== "ok") {
      throw new Error("Expected ok result.");
    }

    expect(result.moduleMask.action).toBe("clear-mask");
    expect(result.moduleMask.previousForms).toEqual([{ formId: 11, state: 1, opacity: 1 }]);
  });

  test("parses unavailable source-module-mask-unavailable responses", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();
    const result = parser.parseApplyModuleInstanceMask(
      JSON.stringify(createPayload("unavailable", "source-module-mask-unavailable")),
      createDiagnostics()
    );

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "source-module-mask-unavailable"
    });
  });

  test("rejects invalid unavailable reasons", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseApplyModuleInstanceMask(
        JSON.stringify(createPayload("unavailable", "unsupported-module-action")),
        createDiagnostics()
      )
    ).toThrow("module mask responses");
  });
});

function createDiagnostics(): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly ["/helper", "apply-module-instance-mask"];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 3;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", "apply-module-instance-mask"],
    exitCode: 0,
    elapsedMilliseconds: 3
  } as const;
}

function createPayload(
  status: "ok" | "unavailable",
  reason?: string
): Record<string, unknown> {
  return {
    bridgeVersion: 1,
    status,
    ...(reason === undefined ? {} : { reason }),
    session: { view: "darkroom", renderSequence: 1, historyChangeSequence: 1, imageLoadSequence: 1 },
    activeImage: {
      imageId: 7,
      directoryPath: "/photos",
      fileName: "frame.ARW",
      sourceAssetPath: "/photos/frame.ARW"
    },
    moduleMask: {
      targetInstanceKey: "colorbalancergb#7#1#",
      action: "clear-mask",
      moduleOp: "colorbalancergb",
      iopOrder: 18,
      multiPriority: 1,
      multiName: "mask",
      previousHasMask: true,
      currentHasMask: false,
      changed: true,
      previousForms: [{ formId: 11, state: 1, opacity: 1 }],
      sourceForms: [],
      currentForms: [],
      historyBefore: 2,
      historyAfter: 3,
      requestedHistoryEnd: 3
    },
    ...(status === "ok"
      ? {
          snapshot: {
            appliedHistoryEnd: 1,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: { view: "darkroom", activeImage: true },
                valueType: { type: "number", minimum: -3, maximum: 4 },
                value: 0.5
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure#0#0#",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "",
                params: { encoding: "unsupported" },
                blend: {
                  supported: true,
                  masksSupported: true,
                  opacity: 100,
                  blendMode: "normal",
                  reverseOrder: false,
                  blendColorspace: "rgb-scene"
                }
              },
              {
                instanceKey: "colorbalancergb#7#1#",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 18,
                multiPriority: 1,
                multiName: "mask",
                params: { encoding: "unsupported" },
                blend: {
                  supported: true,
                  masksSupported: true,
                  opacity: 75,
                  blendMode: "normal",
                  reverseOrder: false,
                  blendColorspace: "rgb-scene"
                }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure#0#0#",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "",
                params: { encoding: "unsupported" },
                blend: {
                  supported: true,
                  masksSupported: true,
                  opacity: 100,
                  blendMode: "normal",
                  reverseOrder: false,
                  blendColorspace: "rgb-scene"
                }
              },
              {
                index: 1,
                applied: true,
                instanceKey: "colorbalancergb#7#1#",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 18,
                multiPriority: 1,
                multiName: "mask",
                params: { encoding: "unsupported" },
                blend: {
                  supported: true,
                  masksSupported: true,
                  opacity: 75,
                  blendMode: "normal",
                  reverseOrder: false,
                  blendColorspace: "rgb-scene"
                }
              }
            ]
          }
        }
      : {})
  };
}

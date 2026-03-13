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

describe("DarktableLiveBridgeResponseParser module blend payloads", (): void => {
  test("parses successful apply-module-instance-blend payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            moduleOp: "exposure",
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            previousOpacity: 100,
            requestedOpacity: 75,
            currentOpacity: 75,
            historyBefore: 2,
            historyAfter: 3,
            requestedHistoryEnd: 3
          },
          snapshot: createSnapshot(75)
        }),
        diagnostics
      )
    ).toMatchObject({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        currentOpacity: 75
      },
      snapshot: {
        moduleStack: [
          {
            blend: {
              supported: true,
              opacity: 75,
              blendMode: "normal",
              reverseOrder: false
            }
          }
        ]
      }
    });
  });

  test("parses successful module blend payloads with blend mode and reverse order fields", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "colorbalancergb#7#1#",
            moduleOp: "colorbalancergb",
            iopOrder: 18,
            multiPriority: 1,
            multiName: "mask",
            previousBlendMode: "normal",
            requestedBlendMode: "multiply",
            currentBlendMode: "multiply",
            previousReverseOrder: false,
            requestedReverseOrder: true,
            currentReverseOrder: true,
            historyBefore: 2,
            historyAfter: 3,
            requestedHistoryEnd: 3
          },
          snapshot: createSnapshot(75)
        }),
        diagnostics
      )
    ).toMatchObject({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
      moduleBlend: {
        targetInstanceKey: "colorbalancergb#7#1#",
        currentBlendMode: "multiply",
        currentReverseOrder: true
      }
    });
  });

  test("parses unavailable module blend payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unsupported-module-blend",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            requestedOpacity: 75
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unsupported-module-blend",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 22,
        historyChangeSequence: 11,
        imageLoadSequence: 3
      },
      activeImage: {
        imageId: 42,
        directoryPath: "/photos/session",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/session/frame.ARW"
      },
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        requestedOpacity: 75
      }
    });
  });

  test("parses module-blend-failed unavailable payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "module-blend-failed",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            previousOpacity: 100,
            requestedOpacity: 75,
            currentOpacity: 100,
            historyBefore: 2,
            historyAfter: 2,
            requestedHistoryEnd: 2
          }
        }),
        diagnostics
      )
    ).toMatchObject({
      status: "unavailable",
      reason: "module-blend-failed",
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        currentOpacity: 100
      }
    });
  });

  test("parses unsupported-module-blend-mode unavailable payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unsupported-module-blend-mode",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "colorbalancergb#7#1#",
            requestedBlendMode: "softlight"
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unsupported-module-blend-mode",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 22,
        historyChangeSequence: 11,
        imageLoadSequence: 3
      },
      activeImage: {
        imageId: 42,
        directoryPath: "/photos/session",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/session/frame.ARW"
      },
      moduleBlend: {
        targetInstanceKey: "colorbalancergb#7#1#",
        requestedBlendMode: "softlight"
      }
    });
  });

  test("parses snapshot-unavailable module blend payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceBlend(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "snapshot-unavailable",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 11,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            previousOpacity: 100,
            requestedOpacity: 75,
            currentOpacity: 75,
            historyBefore: 2,
            historyAfter: 3,
            requestedHistoryEnd: 3
          }
        }),
        diagnostics
      )
    ).toMatchObject({
      status: "unavailable",
      reason: "snapshot-unavailable",
      moduleBlend: {
        targetInstanceKey: "exposure#0#0#",
        currentOpacity: 75
      }
    });
  });

});

interface SnapshotFixture {
  readonly appliedHistoryEnd: number;
  readonly controls: ReadonlyArray<unknown>;
  readonly moduleStack: ReadonlyArray<unknown>;
  readonly historyItems: ReadonlyArray<unknown>;
}

function createSnapshot(opacity: number): SnapshotFixture {
  return {
    appliedHistoryEnd: 1,
    controls: [
      {
        id: "exposure.exposure",
        module: "exposure",
        control: "exposure",
        operations: ["get", "set"],
        requires: { activeImage: true, view: "darkroom" },
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
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" }
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
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" }
      }
    ]
  };
}

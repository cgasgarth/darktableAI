import { describe, expect, test } from "bun:test";

import { validateLiveSnapshot } from "./validate-live-snapshot-support";

describe("validateLiveSnapshot errors", (): void => {
  test("rejects payloads missing the exposure control value", (): void => {
    expect(() =>
      validateLiveSnapshot({
        snapshotResponse: {
          requestId: "req-1",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 8
          },
          session: {
            view: "darkroom",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/asset.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 0,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                }
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: []
          }
        },
        assetPath: "/asset.ARW",
        liveBridgePath: "/helper"
      })
    ).toThrow("live-session-snapshot exposure.exposure control must include a value.");
  });

  test("rejects payloads with duplicate exposure controls", (): void => {
    expect(() =>
      validateLiveSnapshot({
        snapshotResponse: {
          requestId: "req-1",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 8
          },
          session: {
            view: "darkroom",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/asset.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 0,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.25
              },
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.35
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: []
          }
        },
        assetPath: "/asset.ARW",
        liveBridgePath: "/helper"
      })
    ).toThrow("live-session-snapshot snapshot controls must contain exactly one 'exposure.exposure' entry.");
  });

  test("rejects payloads whose applied history exceeds the snapshot history array", (): void => {
    expect(() =>
      validateLiveSnapshot({
        snapshotResponse: {
          requestId: "req-1",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 8
          },
          session: {
            view: "darkroom",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/asset.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 2,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.25
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ]
          }
        },
        assetPath: "/asset.ARW",
        liveBridgePath: "/helper"
      })
    ).toThrow("live-session-snapshot snapshot historyItems must cover the applied history range.");
  });

  test("rejects payloads whose module stack omits exposure", (): void => {
    expect(() =>
      validateLiveSnapshot({
        snapshotResponse: {
          requestId: "req-1",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 8
          },
          session: {
            view: "darkroom",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/asset.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 1,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.25
              }
            ],
            moduleStack: [
              {
                instanceKey: "contrast:0",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "contrast:0",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ]
          }
        },
        assetPath: "/asset.ARW",
        liveBridgePath: "/helper"
      })
    ).toThrow("live-session-snapshot snapshot moduleStack must include module 'exposure'.");
  });

  test("rejects payloads whose exposure control no longer requires an active image", (): void => {
    expect(() =>
      validateLiveSnapshot({
        snapshotResponse: {
          requestId: "req-1",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "get-snapshot"],
            exitCode: 0,
            elapsedMilliseconds: 8
          },
          session: {
            view: "darkroom",
            renderSequence: 8,
            historyChangeSequence: 4,
            imageLoadSequence: 1
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/asset.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 1,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: false,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.25
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ]
          }
        },
        assetPath: "/asset.ARW",
        liveBridgePath: "/helper"
      })
    ).toThrow("live-session-snapshot exposure control requires.activeImage changed unexpectedly.");
  });
});

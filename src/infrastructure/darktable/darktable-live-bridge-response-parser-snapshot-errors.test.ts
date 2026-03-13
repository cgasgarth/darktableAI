import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-snapshot"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser snapshot errors", (): void => {
  test("rejects get-snapshot payloads missing exposure.exposure control", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseGetSnapshot(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
          },
          snapshot: {
            appliedHistoryEnd: 0,
            controls: [],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: []
          }
        }),
        diagnostics
      )
    ).toThrow("darktable-live-bridge field 'snapshot.controls' must contain exactly one 'exposure.exposure' entry.");
  });

  test("rejects get-snapshot payloads missing control values", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseGetSnapshot(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
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
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: []
          }
        }),
        diagnostics
      )
    ).toThrow("darktable-live-bridge field 'snapshot.controls[0].value' must be present.");
  });

  test("rejects get-snapshot payloads with duplicate exposure controls", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseGetSnapshot(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
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
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: []
          }
        }),
        diagnostics
      )
    ).toThrow("darktable-live-bridge field 'snapshot.controls' must contain exactly one 'exposure.exposure' entry.");
  });

  test("rejects get-snapshot payloads with malformed params encoding", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseGetSnapshot(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
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
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "mystery"
                }
              }
            ],
            historyItems: []
          }
        }),
        diagnostics
      )
    ).toThrow(
      "darktable-live-bridge field 'snapshot.moduleStack[0].params.encoding' must be 'introspection-v1' or 'unsupported'."
    );
  });

  test("rejects get-snapshot payloads whose applied history entries are not marked applied", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseGetSnapshot(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          activeImage: {
            imageId: 42,
            directoryPath: "/photos/session",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/session/frame.ARW"
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
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
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
                applied: false,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ]
          }
        }),
        diagnostics
      )
    ).toThrow(
      "darktable-live-bridge field 'snapshot.historyItems[0].applied' must be true within the applied history range."
    );
  });
});

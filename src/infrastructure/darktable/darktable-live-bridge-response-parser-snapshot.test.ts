import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-snapshot"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser snapshot payloads", (): void => {
  test("parses get-snapshot payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseGetSnapshot(
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
                value: 0.5
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
                  encoding: "introspection-v1",
                  fields: [
                    {
                      path: "params.exposure",
                      kind: "float",
                      value: 0.5
                    }
                  ]
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
    ).toEqual({
      bridgeVersion: 1,
      status: "ok",
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
            value: 0.5
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
              encoding: "introspection-v1",
              fields: [
                {
                  path: "params.exposure",
                  kind: "float",
                  value: 0.5
                }
              ]
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
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          }
        ]
      }
    });
  });
});

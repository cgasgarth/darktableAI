import { describe, expect, test } from "bun:test";

import { validateLiveSnapshot } from "./validate-live-snapshot-support";

describe("validateLiveSnapshot", (): void => {
  test("accepts live snapshot payloads", (): void => {
    expect(
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
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 3,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "introspection-v1",
                  fields: [
                    {
                      path: "params.exposure",
                      kind: "float",
                      value: 0.25
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
    ).toEqual({
      mode: "snapshot-readback",
      note: "Snapshot readback returned active-image state, controls, and module/history payloads."
    });
  });
});

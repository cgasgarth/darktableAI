import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand reorder", (): void => {
  test("returns reorder module-action results with helper snapshot readback", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 10,
              historyChangeSequence: 5,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#0#1#mask",
              action: "move-after" as const,
              anchorInstanceKey: "exposure#0#0#",
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              previousIopOrder: 14,
              currentIopOrder: 8,
              historyBefore: 4,
              historyAfter: 5,
              requestedHistoryEnd: 5
            },
            snapshot: {
              appliedHistoryEnd: 5,
              controls: [],
              moduleStack: [],
              historyItems: []
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "exposure#0#0#"
              ],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 10,
              historyChangeSequence: 5,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#0#1#mask",
              action: "move-after" as const,
              anchorInstanceKey: "exposure#0#0#",
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              previousIopOrder: 14,
              currentIopOrder: 8,
              historyBefore: 4,
              historyAfter: 5,
              requestedHistoryEnd: 5
            },
            snapshot: {
              appliedHistoryEnd: 5,
              controls: [],
              moduleStack: [],
              historyItems: []
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "exposure#0#0#"
              ],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: [
                "/helper",
                "apply-module-instance-action",
                "colorbalancergb#0#1#mask",
                "move-after",
                "exposure#0#0#"
              ],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-reorder",
      instanceKey: "colorbalancergb#0#1#mask",
      action: "move-after",
      anchorInstanceKey: "exposure#0#0#"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-reorder",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: [
              "/helper",
              "apply-module-instance-action",
              "colorbalancergb#0#1#mask",
              "move-after",
              "exposure#0#0#"
            ],
            exitCode: 0,
            elapsedMilliseconds: 6
          }
        ],
        session: {
          view: "darkroom",
          renderSequence: 10,
          historyChangeSequence: 5,
          imageLoadSequence: 1
        },
        activeImage: {
          imageId: 7,
          directoryPath: "/photos",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/frame.ARW"
        },
        snapshot: {
          appliedHistoryEnd: 5,
          controls: [],
          moduleStack: [],
          historyItems: []
        },
        moduleAction: {
          targetInstanceKey: "colorbalancergb#0#1#mask",
          action: "move-after",
          anchorInstanceKey: "exposure#0#0#",
          moduleOp: "colorbalancergb",
          iopOrder: 8,
          multiPriority: 1,
          multiName: "mask",
          previousIopOrder: 14,
          currentIopOrder: 8,
          historyBefore: 4,
          historyAfter: 5,
          requestedHistoryEnd: 5
        }
      }
    });
  });
});

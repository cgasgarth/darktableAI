import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand delete", (): void => {
  test("returns delete module-action results with helper snapshot readback", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 9,
              historyChangeSequence: 4,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#7#1#mask",
              action: "delete" as const,
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              historyBefore: 6,
              historyAfter: 5,
              requestedHistoryEnd: 5,
              replacementInstanceKey: "colorbalancergb#8#2#replacement",
              replacementIopOrder: 9,
              replacementMultiPriority: 2,
              replacementMultiName: "replacement"
            },
            snapshot: {
              appliedHistoryEnd: 5,
              controls: [],
              moduleStack: [
                {
                  instanceKey: "colorbalancergb#8#2#replacement",
                  moduleOp: "colorbalancergb",
                  enabled: true,
                  iopOrder: 9,
                  multiPriority: 2,
                  multiName: "replacement",
                  params: { encoding: "unsupported" as const }
                }
              ],
              historyItems: []
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 9,
              historyChangeSequence: 4,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "colorbalancergb#7#1#mask",
              action: "delete" as const,
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              historyBefore: 6,
              historyAfter: 5,
              requestedHistoryEnd: 5,
              replacementInstanceKey: "colorbalancergb#8#2#replacement",
              replacementIopOrder: 9,
              replacementMultiPriority: 2,
              replacementMultiName: "replacement"
            },
            snapshot: {
              appliedHistoryEnd: 5,
              controls: [],
              moduleStack: [
                {
                  instanceKey: "colorbalancergb#8#2#replacement",
                  moduleOp: "colorbalancergb",
                  enabled: true,
                  iopOrder: 9,
                  multiPriority: 2,
                  multiName: "replacement",
                  params: { encoding: "unsupported" as const }
                }
              ],
              historyItems: []
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-delete",
      instanceKey: "colorbalancergb#7#1#mask",
      action: "delete"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-delete",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
            exitCode: 0,
            elapsedMilliseconds: 7
          }
        ],
        session: {
          view: "darkroom",
          renderSequence: 9,
          historyChangeSequence: 4,
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
          moduleStack: [
            {
              instanceKey: "colorbalancergb#8#2#replacement",
              moduleOp: "colorbalancergb",
              enabled: true,
              iopOrder: 9,
              multiPriority: 2,
              multiName: "replacement",
              params: { encoding: "unsupported" }
            }
          ],
          historyItems: []
        },
        moduleAction: {
          targetInstanceKey: "colorbalancergb#7#1#mask",
          action: "delete",
          moduleOp: "colorbalancergb",
          iopOrder: 8,
          multiPriority: 1,
          multiName: "mask",
          historyBefore: 6,
          historyAfter: 5,
          requestedHistoryEnd: 5,
          replacementInstanceKey: "colorbalancergb#8#2#replacement",
          replacementIopOrder: 9,
          replacementMultiPriority: 2,
          replacementMultiName: "replacement"
        }
      }
    });
  });
});

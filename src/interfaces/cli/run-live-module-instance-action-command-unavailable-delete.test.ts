import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand unavailable delete", (): void => {
  test("preserves unavailable delete module-action context from the helper", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "module-delete-blocked-last-instance" as const,
            session: {
              view: "darkroom",
              renderSequence: 8,
              historyChangeSequence: 3,
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
              action: "delete",
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              historyBefore: 6,
              historyAfter: 6,
              requestedHistoryEnd: 6
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 5
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "module-delete-blocked-last-instance" as const,
            session: {
              view: "darkroom",
              renderSequence: 8,
              historyChangeSequence: 3,
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
              action: "delete",
              moduleOp: "colorbalancergb",
              iopOrder: 8,
              multiPriority: 1,
              multiName: "mask",
              historyBefore: 6,
              historyAfter: 6,
              requestedHistoryEnd: 6
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 5
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
              exitCode: 0,
              elapsedMilliseconds: 5
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-delete-unavailable",
      instanceKey: "colorbalancergb#7#1#mask",
      action: "delete"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-delete-unavailable",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "module-delete-blocked-last-instance",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "apply-module-instance-action", "colorbalancergb#7#1#mask", "delete"],
            exitCode: 0,
            elapsedMilliseconds: 5
          }
        ],
        session: {
          view: "darkroom",
          renderSequence: 8,
          historyChangeSequence: 3,
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
          action: "delete",
          moduleOp: "colorbalancergb",
          iopOrder: 8,
          multiPriority: 1,
          multiName: "mask",
          historyBefore: 6,
          historyAfter: 6,
          requestedHistoryEnd: 6
        }
      }
    });
  });
});

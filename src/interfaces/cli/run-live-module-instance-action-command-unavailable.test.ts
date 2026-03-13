import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand unavailable", (): void => {
  test("preserves unavailable module-action context from the helper", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "unsupported-module-state" as const,
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
              targetInstanceKey: "exposure#0#0#",
              action: "disable",
              requestedEnabled: false,
              moduleOp: "exposure",
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              previousEnabled: true,
              currentEnabled: true,
              changed: false,
              historyBefore: 2,
              historyAfter: 2,
              requestedHistoryEnd: 2
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "disable"],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "unavailable" as const,
            reason: "unsupported-module-state" as const,
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
              targetInstanceKey: "exposure#0#0#",
              action: "disable",
              requestedEnabled: false,
              moduleOp: "exposure",
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              previousEnabled: true,
              currentEnabled: true,
              changed: false,
              historyBefore: 2,
              historyAfter: 2,
              requestedHistoryEnd: 2
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "disable"],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "disable"],
              exitCode: 0,
              elapsedMilliseconds: 6
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-4",
      instanceKey: "exposure#0#0#",
      action: "disable"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-4",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "unsupported-module-state",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "disable"],
            exitCode: 0,
            elapsedMilliseconds: 6
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
          targetInstanceKey: "exposure#0#0#",
          action: "disable",
          requestedEnabled: false,
          moduleOp: "exposure",
          iopOrder: 12,
          multiPriority: 0,
          multiName: "0",
          previousEnabled: true,
          currentEnabled: true,
          changed: false,
          historyBefore: 2,
          historyAfter: 2,
          requestedHistoryEnd: 2
        }
      }
    });
  });
});

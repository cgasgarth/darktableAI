import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand", (): void => {
  test("returns snapshot readback plus module-action result", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "ok" as const,
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
              requestedEnabled: false,
              moduleOp: "exposure",
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              action: "disable" as const,
              previousEnabled: true,
              currentEnabled: false,
              changed: true,
              historyBefore: 2,
              historyAfter: 3,
              requestedHistoryEnd: 3
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
                  instanceKey: "exposure#0#0#",
                  moduleOp: "exposure",
                  enabled: false,
                  iopOrder: 12,
                  multiPriority: 0,
                  multiName: "0",
                  blend: { supported: false, masksSupported: false },
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ],
              historyItems: [
                {
                  index: 0,
                  applied: true,
                  instanceKey: "exposure#0#0#",
                  moduleOp: "exposure",
                  enabled: false,
                  iopOrder: 12,
                  multiPriority: 0,
                  multiName: "0",
                  blend: { supported: false, masksSupported: false },
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ]
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
            status: "ok" as const,
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
              requestedEnabled: false,
              moduleOp: "exposure",
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              action: "disable" as const,
              previousEnabled: true,
              currentEnabled: false,
              changed: true,
              historyBefore: 2,
              historyAfter: 3,
              requestedHistoryEnd: 3
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
                  instanceKey: "exposure#0#0#",
                  moduleOp: "exposure",
                  enabled: false,
                  iopOrder: 12,
                  multiPriority: 0,
                  multiName: "0",
                  blend: { supported: false, masksSupported: false },
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ],
              historyItems: [
                {
                  index: 0,
                  applied: true,
                  instanceKey: "exposure#0#0#",
                  moduleOp: "exposure",
                  enabled: false,
                  iopOrder: 12,
                  multiPriority: 0,
                  multiName: "0",
                  blend: { supported: false, masksSupported: false },
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ]
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
      requestId: "request-3",
      instanceKey: "exposure#0#0#",
      action: "disable"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-3",
        bridgeVersion: 1,
        status: "ok",
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
              instanceKey: "exposure#0#0#",
              moduleOp: "exposure",
              enabled: false,
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              blend: { supported: false, masksSupported: false },
              params: {
                encoding: "unsupported"
              }
            }
          ],
          historyItems: [
            {
              index: 0,
              applied: true,
              instanceKey: "exposure#0#0#",
              moduleOp: "exposure",
              enabled: false,
              iopOrder: 12,
              multiPriority: 0,
              multiName: "0",
              blend: { supported: false, masksSupported: false },
              params: {
                encoding: "unsupported"
              }
            }
          ]
        },
        moduleAction: {
          targetInstanceKey: "exposure#0#0#",
          requestedEnabled: false,
          moduleOp: "exposure",
          iopOrder: 12,
          multiPriority: 0,
          multiName: "0",
          action: "disable",
          previousEnabled: true,
          currentEnabled: false,
          changed: true,
          historyBefore: 2,
          historyAfter: 3,
          requestedHistoryEnd: 3
        }
      }
    });
  });

});

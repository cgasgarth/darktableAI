import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "apply-module-instance-action"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser module actions", (): void => {
  test("parses apply-module-instance-action payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();
    const result = parser.parseApplyModuleInstanceAction(
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
        },
        snapshot: createSnapshot(false)
      }),
      diagnostics
    );

    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
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
      snapshot: createSnapshot(false),
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
    });
  });

  test("parses expanded unavailable reasons", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceAction(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unknown-instance-key",
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
          moduleAction: {
            targetInstanceKey: "exposure#0#0#",
            action: "disable",
            requestedEnabled: false
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unknown-instance-key",
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
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        action: "disable",
        requestedEnabled: false
      },
      diagnostics
    });
  });

  test.each([
    "unsupported-module-action",
    "unsupported-module-state",
    "module-action-failed",
    "module-delete-blocked-last-instance",
    "snapshot-unavailable"
  ] as const)("parses unavailable reason '%s'", (reason): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseApplyModuleInstanceAction(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason,
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
          moduleAction: {
            targetInstanceKey: "exposure#0#0#",
            action: "disable",
            requestedEnabled: false
          }
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason,
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
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        action: "disable",
        requestedEnabled: false
      },
      diagnostics
    });
  });
});

function createSnapshot(enabled: boolean): {
  readonly appliedHistoryEnd: 1;
  readonly controls: readonly [
    {
      readonly id: "exposure.exposure";
      readonly module: "exposure";
      readonly control: "exposure";
      readonly operations: readonly ["get", "set"];
      readonly requires: {
        readonly activeImage: true;
        readonly view: "darkroom";
      };
      readonly valueType: {
        readonly type: "number";
        readonly minimum: -3;
        readonly maximum: 4;
      };
      readonly value: 0.25;
    }
  ];
  readonly moduleStack: readonly [ReturnType<typeof createSnapshotItem>];
  readonly historyItems: readonly [
    {
      readonly index: 0;
      readonly applied: true;
    } & ReturnType<typeof createSnapshotItem>
  ];
} {
  return {
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
    moduleStack: [createSnapshotItem(enabled)],
    historyItems: [
      {
        index: 0,
        applied: true,
        ...createSnapshotItem(enabled)
      }
    ]
  } as const;
}


function createSnapshotItem(enabled: boolean): {
  readonly instanceKey: "exposure#0#0#";
  readonly moduleOp: "exposure";
  readonly enabled: boolean;
  readonly iopOrder: 12;
  readonly multiPriority: 0;
  readonly multiName: "0";
  readonly blend: {
    readonly supported: false;
    readonly masksSupported: false;
  };
  readonly params: {
    readonly encoding: "unsupported";
  };
} {
  return {
    instanceKey: "exposure#0#0#",
    moduleOp: "exposure",
    enabled,
    iopOrder: 12,
    multiPriority: 0,
    multiName: "0",
    blend: { supported: false, masksSupported: false },
    params: {
      encoding: "unsupported"
    }
  } as const;
}

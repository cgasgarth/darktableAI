import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "apply-module-instance-action"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser create and duplicate module actions", (): void => {
  test.each([
    {
      action: "create" as const,
      targetInstanceKey: "exposure#0#0#",
      resultInstanceKey: "exposure#0#1#1"
    },
    {
      action: "duplicate" as const,
      targetInstanceKey: "exposure#0#1#1",
      resultInstanceKey: "exposure#0#2#2"
    }
  ])("parses %p module-action payloads", ({ action, targetInstanceKey, resultInstanceKey }): void => {
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
          targetInstanceKey,
          action,
          resultInstanceKey,
          moduleOp: "exposure",
          iopOrder: 12,
          multiPriority: 0,
          multiName: "0",
          historyBefore: 2,
          historyAfter: 3,
          requestedHistoryEnd: 3
        },
        snapshot: createSnapshotWithInstanceKey(resultInstanceKey, true)
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
      snapshot: createSnapshotWithInstanceKey(resultInstanceKey, true),
      moduleAction: {
        targetInstanceKey,
        action,
        resultInstanceKey,
        moduleOp: "exposure",
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        historyBefore: 2,
        historyAfter: 3,
        requestedHistoryEnd: 3
      }
    });
  });
});

function createSnapshotWithInstanceKey(instanceKey: string, enabled: boolean): {
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
  readonly moduleStack: readonly [ReturnType<typeof createSnapshotItemWithInstanceKey>];
  readonly historyItems: readonly [
    {
      readonly index: 0;
      readonly applied: true;
    } & ReturnType<typeof createSnapshotItemWithInstanceKey>
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
    moduleStack: [createSnapshotItemWithInstanceKey(instanceKey, enabled)],
    historyItems: [
      {
        index: 0,
        applied: true,
        ...createSnapshotItemWithInstanceKey(instanceKey, enabled)
      }
    ]
  } as const;
}

function createSnapshotItemWithInstanceKey(instanceKey: string, enabled: boolean): {
  readonly instanceKey: string;
  readonly moduleOp: "exposure";
  readonly enabled: boolean;
  readonly iopOrder: 12;
  readonly multiPriority: 0;
  readonly multiName: "0";
  readonly params: {
    readonly encoding: "unsupported";
  };
} {
  return {
    instanceKey,
    moduleOp: "exposure",
    enabled,
    iopOrder: 12,
    multiPriority: 0,
    multiName: "0",
    params: {
      encoding: "unsupported"
    }
  } as const;
}

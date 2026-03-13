import { describe, expect, test } from "bun:test";

import { RunLiveSetModuleBlendCommand } from "./run-live-set-module-blend-command";

describe("RunLiveSetModuleBlendCommand", (): void => {
  test("returns structured snapshot readback for successful blend changes", async (): Promise<void> => {
    const command = new RunLiveSetModuleBlendCommand({
      execute: () =>
        Promise.resolve({
          mutation: createSuccessMutation(),
          latestSnapshot: createSuccessMutation(),
          helperCallDiagnostics: [createDiagnostics()]
        })
    });

    const result = await command.execute({
      requestId: "request-4",
      instanceKey: "exposure#0#0#",
      opacity: 75
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-4",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [createDiagnostics()],
        session: createSession(),
        activeImage: createActiveImage(),
        snapshot: createSnapshot(75),
        moduleBlend: {
          targetInstanceKey: "exposure#0#0#",
          moduleOp: "exposure",
          iopOrder: 12,
          multiPriority: 0,
          multiName: "0",
          previousOpacity: 100,
          requestedOpacity: 75,
          currentOpacity: 75,
          historyBefore: 2,
          historyAfter: 3,
          requestedHistoryEnd: 3
        }
      }
    });
  });

  test("forwards blend mode and reverse order fields for successful blend changes", async (): Promise<void> => {
    const requests: Array<Record<string, unknown>> = [];
    const command = new RunLiveSetModuleBlendCommand({
      execute: (request) => {
        requests.push({ ...request });
        return Promise.resolve({
          mutation: createSuccessMutation('{"blendMode":"multiply","reverseOrder":true}', {
            previousBlendMode: "normal",
            requestedBlendMode: "multiply",
            currentBlendMode: "multiply",
            previousReverseOrder: false,
            requestedReverseOrder: true,
            currentReverseOrder: true
          }),
          latestSnapshot: createSuccessMutation('{"blendMode":"multiply","reverseOrder":true}', {
            previousBlendMode: "normal",
            requestedBlendMode: "multiply",
            currentBlendMode: "multiply",
            previousReverseOrder: false,
            requestedReverseOrder: true,
            currentReverseOrder: true
          }),
          helperCallDiagnostics: [createDiagnostics('{"blendMode":"multiply","reverseOrder":true}')]
        });
      }
    });

    const result = await command.execute({
      requestId: "request-6",
      instanceKey: "colorbalancergb#7#1#",
      blendMode: "multiply",
      reverseOrder: true
    });

    expect(requests).toEqual([
      {
        instanceKey: "colorbalancergb#7#1#",
        blendMode: "multiply",
        reverseOrder: true
      }
    ]);
    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-6",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [createDiagnostics('{"blendMode":"multiply","reverseOrder":true}')],
        session: createSession(),
        activeImage: createActiveImage(),
        snapshot: createSnapshot(75),
        moduleBlend: {
          targetInstanceKey: "exposure#0#0#",
          moduleOp: "exposure",
          iopOrder: 12,
          multiPriority: 0,
          multiName: "0",
          previousOpacity: 100,
          requestedOpacity: 75,
          currentOpacity: 75,
          previousBlendMode: "normal",
          requestedBlendMode: "multiply",
          currentBlendMode: "multiply",
          previousReverseOrder: false,
          requestedReverseOrder: true,
          currentReverseOrder: true,
          historyBefore: 2,
          historyAfter: 3,
          requestedHistoryEnd: 3
        }
      }
    });
  });

  test("returns structured unavailable responses with blend context", async (): Promise<void> => {
    const command = new RunLiveSetModuleBlendCommand({
      execute: () =>
        Promise.resolve({
          mutation: createUnavailableMutation(),
          latestSnapshot: createUnavailableMutation(),
          helperCallDiagnostics: [createDiagnostics()]
        })
    });

    const result = await command.execute({
      requestId: "request-5",
      instanceKey: "exposure#0#0#",
      opacity: 75
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-5",
        bridgeVersion: 1,
        status: "unavailable",
        reason: "unsupported-module-blend",
        diagnostics: [createDiagnostics()],
        session: createSession(),
        activeImage: createActiveImage(),
        moduleBlend: {
          targetInstanceKey: "exposure#0#0#",
          requestedOpacity: 75
        }
      }
    });
  });
});

function createSuccessMutation(
  payload = '{"opacity":75}',
  moduleBlendOverrides: Record<string, unknown> = {}
): {
  readonly bridgeVersion: 1;
  readonly status: "ok";
  readonly session: ReturnType<typeof createSession>;
  readonly activeImage: ReturnType<typeof createActiveImage>;
  readonly moduleBlend: {
    readonly targetInstanceKey: "exposure#0#0#";
    readonly moduleOp: "exposure";
    readonly iopOrder: 12;
    readonly multiPriority: 0;
    readonly multiName: "0";
    readonly previousOpacity?: 100;
    readonly requestedOpacity?: 75;
    readonly currentOpacity?: 75;
    readonly previousBlendMode?: "normal";
    readonly requestedBlendMode?: "multiply";
    readonly currentBlendMode?: "multiply";
    readonly previousReverseOrder?: false;
    readonly requestedReverseOrder?: true;
    readonly currentReverseOrder?: true;
    readonly historyBefore: 2;
    readonly historyAfter: 3;
    readonly requestedHistoryEnd: 3;
  };
  readonly snapshot: ReturnType<typeof createSnapshot>;
  readonly diagnostics: ReturnType<typeof createDiagnostics>;
} {
  return {
    bridgeVersion: 1 as const,
    status: "ok" as const,
    session: createSession(),
    activeImage: createActiveImage(),
    moduleBlend: {
      targetInstanceKey: "exposure#0#0#",
      moduleOp: "exposure",
      iopOrder: 12,
      multiPriority: 0,
      multiName: "0",
      previousOpacity: 100,
      requestedOpacity: 75,
      currentOpacity: 75,
      ...moduleBlendOverrides,
      historyBefore: 2,
      historyAfter: 3,
      requestedHistoryEnd: 3
    },
    snapshot: createSnapshot(75),
    diagnostics: createDiagnostics(payload)
  } as const;
}

function createUnavailableMutation(): {
  readonly bridgeVersion: 1;
  readonly status: "unavailable";
  readonly reason: "unsupported-module-blend";
  readonly session: ReturnType<typeof createSession>;
  readonly activeImage: ReturnType<typeof createActiveImage>;
  readonly moduleBlend: {
    readonly targetInstanceKey: "exposure#0#0#";
    readonly requestedOpacity: 75;
  };
  readonly diagnostics: ReturnType<typeof createDiagnostics>;
} {
  return {
    bridgeVersion: 1 as const,
    status: "unavailable" as const,
    reason: "unsupported-module-blend" as const,
    session: createSession(),
    activeImage: createActiveImage(),
    moduleBlend: {
      targetInstanceKey: "exposure#0#0#",
      requestedOpacity: 75
    },
    diagnostics: createDiagnostics()
  } as const;
}

function createSession(): {
  readonly view: "darkroom";
  readonly renderSequence: 8;
  readonly historyChangeSequence: 3;
  readonly imageLoadSequence: 1;
} {
  return {
    view: "darkroom",
    renderSequence: 8,
    historyChangeSequence: 3,
    imageLoadSequence: 1
  } as const;
}

function createActiveImage(): {
  readonly imageId: 7;
  readonly directoryPath: "/photos";
  readonly fileName: "frame.ARW";
  readonly sourceAssetPath: "/photos/frame.ARW";
} {
  return {
    imageId: 7,
    directoryPath: "/photos",
    fileName: "frame.ARW",
    sourceAssetPath: "/photos/frame.ARW"
  } as const;
}

function createSnapshot(opacity: number): {
  readonly appliedHistoryEnd: 1;
  readonly controls: readonly [
    {
      readonly id: "exposure.exposure";
      readonly module: "exposure";
      readonly control: "exposure";
      readonly operations: readonly ["get", "set"];
      readonly requires: { readonly activeImage: true; readonly view: "darkroom" };
      readonly valueType: { readonly type: "number"; readonly minimum: -3; readonly maximum: 4 };
      readonly value: 0.25;
    }
  ];
  readonly moduleStack: readonly [
    {
      readonly instanceKey: "exposure#0#0#";
      readonly moduleOp: "exposure";
      readonly enabled: true;
      readonly iopOrder: 12;
      readonly multiPriority: 0;
      readonly multiName: "0";
      readonly blend: {
        readonly supported: true;
        readonly masksSupported: true;
        readonly opacity: number;
        readonly blendMode: "normal";
        readonly reverseOrder: false;
      };
      readonly params: { readonly encoding: "unsupported" };
    }
  ];
  readonly historyItems: readonly [
    {
      readonly index: 0;
      readonly applied: true;
      readonly instanceKey: "exposure#0#0#";
      readonly moduleOp: "exposure";
      readonly enabled: true;
      readonly iopOrder: 12;
      readonly multiPriority: 0;
      readonly multiName: "0";
      readonly blend: {
        readonly supported: true;
        readonly masksSupported: true;
        readonly opacity: number;
        readonly blendMode: "normal";
        readonly reverseOrder: false;
      };
      readonly params: { readonly encoding: "unsupported" };
    }
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
        requires: { activeImage: true, view: "darkroom" },
        valueType: { type: "number", minimum: -3, maximum: 4 },
        value: 0.25
      }
    ],
    moduleStack: [
      {
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" as const }
      }
    ],
    historyItems: [
      {
        index: 0,
        applied: true,
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" as const }
      }
    ]
  } as const;
}

function createDiagnostics(payload = '{"opacity":75}'): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly ["/helper", "apply-module-instance-blend", "exposure#0#0#", string];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 6;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", "apply-module-instance-blend", "exposure#0#0#", payload],
    exitCode: 0,
    elapsedMilliseconds: 6
  } as const;
}

import { describe, expect, test } from "bun:test";

import type {
  LiveDarktableModuleBlendMutation,
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import { SetLiveDarktableModuleBlend } from "./set-live-darktable-module-blend";

describe("SetLiveDarktableModuleBlend", (): void => {
  test("returns helper mutation and snapshot readback for successful opacity changes", async (): Promise<void> => {
    const mutation = {
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
        historyBefore: 2,
        historyAfter: 3,
        requestedHistoryEnd: 3
      },
      snapshot: createSnapshot(75),
      diagnostics: createDiagnostics()
    };
    const gateway = new StubGateway(mutation);
    const useCase = new SetLiveDarktableModuleBlend(gateway);

    const result = await useCase.execute({
      instanceKey: "exposure#0#0#",
      opacity: 75
    });

    expect(gateway.requests).toEqual([{ instanceKey: "exposure#0#0#", opacity: 75 }]);
    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics()]
    });
  });

  test("preserves unavailable machine-readable reasons", async (): Promise<void> => {
    const mutation = {
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
    };
    const gateway = new StubGateway(mutation);
    const useCase = new SetLiveDarktableModuleBlend(gateway);

    const result = await useCase.execute({
      instanceKey: "exposure#0#0#",
      opacity: 75
    });

    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics()]
    });
  });
});

class StubGateway {
  public readonly requests: Array<{ readonly instanceKey: string; readonly opacity: number }> = [];

  public constructor(private readonly mutation: LiveDarktableModuleBlendMutation) {}

  public getSession(): Promise<LiveDarktableSessionSnapshot> {
    throw new Error("Unexpected getSession call.");
  }

  public getSnapshot(): Promise<LiveDarktableSnapshotReadback> {
    throw new Error("Unexpected getSnapshot call.");
  }

  public setExposure(): Promise<never> {
    throw new Error("Unexpected setExposure call.");
  }

  public applyModuleInstanceBlend(request: {
    readonly instanceKey: string;
    readonly opacity: number;
  }): Promise<LiveDarktableModuleBlendMutation> {
    this.requests.push(request);
    return Promise.resolve(this.mutation);
  }

  public applyModuleInstanceAction(): Promise<LiveDarktableModuleInstanceActionMutation> {
    throw new Error("Unexpected applyModuleInstanceAction call.");
  }
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

function createDiagnostics(): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly ["/helper", "apply-module-instance-blend", "exposure#0#0#", '{"opacity":75}'];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: 6;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", "apply-module-instance-blend", "exposure#0#0#", '{"opacity":75}'],
    exitCode: 0,
    elapsedMilliseconds: 6
  } as const;
}

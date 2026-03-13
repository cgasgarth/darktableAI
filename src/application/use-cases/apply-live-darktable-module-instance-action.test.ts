import { describe, expect, test } from "bun:test";

import type {
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import { ApplyLiveDarktableModuleInstanceAction } from "./apply-live-darktable-module-instance-action";

describe("ApplyLiveDarktableModuleInstanceAction", (): void => {
  test("returns truthful snapshot readback after a successful action", async (): Promise<void> => {
    const mutation = {
      bridgeVersion: 1 as const,
      status: "ok" as const,
      session: createSession(8),
      activeImage: createActiveImage(),
      moduleAction: createModuleAction("disable", true, false),
      snapshot: {
        appliedHistoryEnd: 1,
        controls: [createExposureControl()],
        moduleStack: [createModuleState(false)],
        historyItems: [createHistoryItem(false)]
      },
      diagnostics: createDiagnostics("apply-module-instance-action", 6)
    };
    const gateway = new StubGateway({
      mutation,
      snapshot: {
        bridgeVersion: 1,
        status: "ok",
        session: createSession(9),
        activeImage: createActiveImage(),
        snapshot: {
          appliedHistoryEnd: 1,
          controls: [createExposureControl()],
          moduleStack: [createModuleState(false)],
          historyItems: [createHistoryItem(false)]
        },
        diagnostics: createDiagnostics("get-snapshot", 5)
      }
    });
    const useCase = new ApplyLiveDarktableModuleInstanceAction(gateway);

    const result = await useCase.execute({
      instanceKey: "exposure#0#0#",
      action: "disable"
    });

    expect(gateway.requests).toEqual([
      {
        instanceKey: "exposure#0#0#",
        action: "disable"
      }
    ]);
    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics("apply-module-instance-action", 6)]
    });
  });

  test("does not fetch snapshot when the mutation is unavailable", async (): Promise<void> => {
    const mutation = {
      bridgeVersion: 1 as const,
      status: "unavailable" as const,
      reason: "unknown-instance-key" as const,
      session: createSession(8),
      diagnostics: createDiagnostics("apply-module-instance-action", 4)
    };
    const gateway = new StubGateway({
      mutation,
      snapshot: {
        bridgeVersion: 1,
        status: "ok",
        session: createSession(9),
        activeImage: createActiveImage(),
        snapshot: {
          appliedHistoryEnd: 1,
          controls: [createExposureControl()],
          moduleStack: [createModuleState(true)],
          historyItems: [createHistoryItem(true)]
        },
        diagnostics: createDiagnostics("get-snapshot", 5)
      }
    });
    const useCase = new ApplyLiveDarktableModuleInstanceAction(gateway);

    const result = await useCase.execute({
      instanceKey: "missing#-1#-1#missing",
      action: "enable"
    });

    expect(gateway.getSnapshotCalls).toBe(0);
    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics("apply-module-instance-action", 4)]
    });
  });

  test("returns helper snapshot for create mutations without extra readback", async (): Promise<void> => {
    const mutation = {
      bridgeVersion: 1 as const,
      status: "ok" as const,
      session: createSession(10),
      activeImage: createActiveImage(),
      moduleAction: createForkModuleAction("create", "exposure#0#0#", "exposure#0#1#1"),
      snapshot: {
        appliedHistoryEnd: 2,
        controls: [createExposureControl()],
        moduleStack: [createModuleState(true, "exposure#0#1#1")],
        historyItems: [createHistoryItem(true, "exposure#0#1#1")]
      },
      diagnostics: createDiagnostics("apply-module-instance-action", 7)
    };
    const gateway = new StubGateway({
      mutation,
      snapshot: mutation
    });
    const useCase = new ApplyLiveDarktableModuleInstanceAction(gateway);

    const result = await useCase.execute({
      instanceKey: "exposure#0#0#",
      action: "create"
    });

    expect(gateway.requests).toEqual([
      {
        instanceKey: "exposure#0#0#",
        action: "create"
      }
    ]);
    expect(gateway.getSnapshotCalls).toBe(0);
    expect(result).toEqual({
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [createDiagnostics("apply-module-instance-action", 7)]
    });
  });
});

class StubGateway {
  public readonly requests: Array<{
    readonly instanceKey: string;
    readonly action: "enable" | "disable" | "create" | "duplicate" | "delete" | "move-before" | "move-after";
    readonly anchorInstanceKey?: string;
  }> = [];
  public getSnapshotCalls = 0;

  public constructor(
    public readonly state: {
      readonly mutation: LiveDarktableModuleInstanceActionMutation;
      readonly snapshot: LiveDarktableSnapshotReadback;
    }
  ) {}

  public getSession(): Promise<LiveDarktableSessionSnapshot> {
    throw new Error("Unexpected getSession call.");
  }

  public getSnapshot(): Promise<LiveDarktableSnapshotReadback> {
    this.getSnapshotCalls += 1;
    return Promise.resolve(this.state.snapshot);
  }

  public setExposure(): Promise<never> {
    throw new Error("Unexpected setExposure call.");
  }

  public applyModuleInstanceBlend(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceBlend call.");
  }

  public applyModuleInstanceMask(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceMask call.");
  }

  public applyModuleInstanceAction(request: {
    readonly instanceKey: string;
    readonly action: "enable" | "disable" | "create" | "duplicate" | "delete" | "move-before" | "move-after";
    readonly anchorInstanceKey?: string;
  }): Promise<LiveDarktableModuleInstanceActionMutation> {
    this.requests.push(request);
    return Promise.resolve(this.state.mutation);
  }
}

function createSession(renderSequence: number): {
  readonly view: "darkroom";
  readonly renderSequence: number;
  readonly historyChangeSequence: 3;
  readonly imageLoadSequence: 1;
} {
  return {
    view: "darkroom",
    renderSequence,
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

function createModuleAction(
  action: "enable" | "disable",
  previousEnabled: boolean,
  currentEnabled: boolean
): {
  readonly targetInstanceKey: "exposure#0#0#";
  readonly requestedEnabled: boolean;
  readonly moduleOp: "exposure";
  readonly iopOrder: 12;
  readonly multiPriority: 0;
  readonly multiName: "0";
  readonly action: "enable" | "disable";
  readonly previousEnabled: boolean;
  readonly currentEnabled: boolean;
  readonly changed: boolean;
  readonly historyBefore: 1;
  readonly historyAfter: 1;
  readonly requestedHistoryEnd: 1;
} {
  return {
    targetInstanceKey: "exposure#0#0#",
    requestedEnabled: action === "enable",
    moduleOp: "exposure",
    iopOrder: 12,
    multiPriority: 0,
    multiName: "0",
    action,
    previousEnabled,
    currentEnabled,
    changed: previousEnabled !== currentEnabled,
    historyBefore: 1,
    historyAfter: 1,
    requestedHistoryEnd: 1
  } as const;
}

function createForkModuleAction(
  action: "create" | "duplicate",
  targetInstanceKey: string,
  resultInstanceKey: string
): {
  readonly targetInstanceKey: string;
  readonly action: "create" | "duplicate";
  readonly resultInstanceKey: string;
  readonly moduleOp: "exposure";
  readonly iopOrder: 12;
  readonly multiPriority: 1;
  readonly multiName: "1";
  readonly historyBefore: 1;
  readonly historyAfter: 2;
  readonly requestedHistoryEnd: 2;
} {
  return {
    targetInstanceKey,
    action,
    resultInstanceKey,
    moduleOp: "exposure",
    iopOrder: 12,
    multiPriority: 1,
    multiName: "1",
    historyBefore: 1,
    historyAfter: 2,
    requestedHistoryEnd: 2
  } as const;
}

function createExposureControl(): {
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
  readonly value: 0;
} {
  return {
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
    value: 0
  } as const;
}

function createModuleState(enabled: boolean, instanceKey = "exposure#0#0#"): {
  readonly instanceKey: string;
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
    instanceKey,
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

function createHistoryItem(enabled: boolean, instanceKey = "exposure#0#0#"): {
  readonly index: 0;
  readonly applied: true;
  readonly instanceKey: string;
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
    index: 0,
    applied: true,
    ...createModuleState(enabled, instanceKey)
  } as const;
}

function createDiagnostics(commandName: string, elapsedMilliseconds: number): {
  readonly helperBinaryPath: "/helper";
  readonly commandArguments: readonly ["/helper", string];
  readonly exitCode: 0;
  readonly elapsedMilliseconds: number;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", commandName],
    exitCode: 0,
    elapsedMilliseconds
  } as const;
}

import { describe, expect, test } from "bun:test";

import type {
  LiveDarktableExposureMutation,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import { SetLiveDarktableExposure } from "./set-live-darktable-exposure";

describe("SetLiveDarktableExposure", (): void => {
  test("returns immediately when wait mode is none", async (): Promise<void> => {
    const gateway = new StubGateway({
      mutation: {
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 10,
          historyChangeSequence: 4,
          imageLoadSequence: 1
        },
        exposure: {
          previous: 0,
          requested: 0.5,
          current: 0.5,
          requestedRenderSequence: 12
        },
        diagnostics: createDiagnostics("set-exposure", 5)
      },
      sessions: []
    });
    const useCase = new SetLiveDarktableExposure(gateway, new StubClock([]), new StubSleeper());

    const result = await useCase.execute({
      exposure: 0.5,
      wait: {
        mode: "none"
      }
    });

    expect(gateway.getSessionCalls).toBe(0);
    expect(result.wait).toEqual({
      mode: "none",
      targetRenderSequence: 12,
      pollCount: 0,
      completed: true,
      timedOut: false
    });
  });

  test("polls until the requested render sequence is observed", async (): Promise<void> => {
    const gateway = new StubGateway({
      mutation: {
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 10,
          historyChangeSequence: 4,
          imageLoadSequence: 1
        },
        exposure: {
          previous: 0,
          requested: 1,
          current: 1,
          requestedRenderSequence: 12
        },
        diagnostics: createDiagnostics("set-exposure", 8)
      },
      sessions: [
        {
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 11,
            historyChangeSequence: 5,
            imageLoadSequence: 1
          },
          exposure: {
            current: 1
          },
          diagnostics: createDiagnostics("get-session", 3)
        },
        {
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 12,
            historyChangeSequence: 5,
            imageLoadSequence: 1
          },
          exposure: {
            current: 1
          },
          diagnostics: createDiagnostics("get-session", 4)
        }
      ]
    });
    const sleeper = new StubSleeper();
    const useCase = new SetLiveDarktableExposure(
      gateway,
      new StubClock([new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-01T00:00:00.050Z")]),
      sleeper
    );

    const result = await useCase.execute({
      exposure: 1,
      wait: {
        mode: "until-render",
        timeoutMilliseconds: 500,
        pollIntervalMilliseconds: 50
      }
    });

    expect(sleeper.calls).toEqual([50, 50]);
    expect(gateway.getSessionCalls).toBe(2);
    expect(result.latestSession.status).toBe("ok");
    expect(result.wait).toEqual({
      mode: "until-render",
      targetRenderSequence: 12,
      latestObservedRenderSequence: 12,
      pollCount: 2,
      completed: true,
      timedOut: false,
      timeoutMilliseconds: 500,
      pollIntervalMilliseconds: 50
    });
  });

  test("returns the latest snapshot when waiting times out", async (): Promise<void> => {
    const gateway = new StubGateway({
      mutation: {
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 10,
          historyChangeSequence: 4,
          imageLoadSequence: 1
        },
        exposure: {
          previous: 0,
          requested: 1.5,
          current: 1.5,
          requestedRenderSequence: 15
        },
        diagnostics: createDiagnostics("set-exposure", 9)
      },
      sessions: [
        {
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 12,
            historyChangeSequence: 5,
            imageLoadSequence: 1
          },
          exposure: {
            current: 1.5
          },
          diagnostics: createDiagnostics("get-session", 3)
        }
      ]
    });
    const useCase = new SetLiveDarktableExposure(
      gateway,
      new StubClock([new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-01T00:00:00.200Z")]),
      new StubSleeper()
    );

    const result = await useCase.execute({
      exposure: 1.5,
      wait: {
        mode: "until-render",
        timeoutMilliseconds: 100,
        pollIntervalMilliseconds: 25
      }
    });

    expect(result.wait).toEqual({
      mode: "until-render",
      targetRenderSequence: 15,
      latestObservedRenderSequence: 12,
      pollCount: 1,
      completed: false,
      timedOut: true,
      timeoutMilliseconds: 100,
      pollIntervalMilliseconds: 25
    });
  });
});

class StubGateway {
  public getSessionCalls = 0;

  public constructor(
    private readonly state: {
      readonly mutation: LiveDarktableExposureMutation;
      readonly sessions: ReadonlyArray<LiveDarktableSessionSnapshot>;
    }
  ) {}

  public getSession(): Promise<LiveDarktableSessionSnapshot> {
    const session = this.state.sessions[this.getSessionCalls];

    if (session === undefined) {
      throw new Error("No configured live session response.");
    }

    this.getSessionCalls += 1;
    return Promise.resolve(session);
  }

  public getSnapshot(): Promise<never> {
    throw new Error("Unexpected getSnapshot call.");
  }

  public setExposure(): Promise<LiveDarktableExposureMutation> {
    return Promise.resolve(this.state.mutation);
  }

  public applyModuleInstanceBlend(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceBlend call.");
  }

  public applyModuleInstanceAction(): Promise<never> {
    throw new Error("Unexpected applyModuleInstanceAction call.");
  }
}

class StubClock {
  private index = 0;

  public constructor(private readonly values: ReadonlyArray<Date>) {}

  public now(): Date {
    const value = this.values[this.index];

    if (value === undefined) {
      throw new Error("Clock has no more configured values.");
    }

    this.index += 1;
    return value;
  }
}

class StubSleeper {
  public readonly calls: Array<number> = [];

  public sleep(milliseconds: number): Promise<void> {
    this.calls.push(milliseconds);
    return Promise.resolve();
  }
}

function createDiagnostics(commandName: string, elapsedMilliseconds: number): {
  readonly helperBinaryPath: string;
  readonly commandArguments: ReadonlyArray<string>;
  readonly exitCode: number;
  readonly elapsedMilliseconds: number;
} {
  return {
    helperBinaryPath: "/helper",
    commandArguments: ["/helper", commandName],
    exitCode: 0,
    elapsedMilliseconds
  };
}

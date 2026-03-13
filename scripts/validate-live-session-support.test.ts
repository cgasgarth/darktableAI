import { describe, expect, test } from "bun:test";

import {
  type ValidateLiveSmokeInput,
  validateLiveSmoke
} from "./validate-live-session-support";

describe("validateLiveSmoke", (): void => {
  test("accepts completed live exposure mutations", (): void => {
    const result = validateLiveSmoke(
      createInput({
        mutation: {
          requestId: "req-2",
          bridgeVersion: 1,
          status: "ok",
          diagnostics: [
            createHelperDiagnostics(["/helper", "set-exposure", "1.25"])
          ],
          wait: {
            mode: "until-render",
            timeoutMilliseconds: 1500,
            pollIntervalMilliseconds: 100,
            latestObservedRenderSequence: 12,
            completed: true,
            timedOut: false
          },
          setExposure: {
            requested: 1.25,
            previous: 0,
            current: 1.25,
            requestedRenderSequence: 12
          },
          session: {
            view: "darkroom",
            renderSequence: 12
          },
          activeImage: {
            sourceAssetPath: "/asset.ARW"
          },
          exposure: {
            current: 1.25
          }
        },
        secondSession: createSessionPayload({
          requestId: "req-3",
          renderSequence: 12,
          currentExposure: 1.25
        })
      })
    );

    expect(result).toEqual({
      mode: "render-completed",
      note: "Exposure mutation completed and read back at the requested value."
    });
  });

  test("rejects timed out live exposure mutations", (): void => {
    expect(() =>
      validateLiveSmoke(
        createInput({
          mutation: {
            requestId: "req-2",
            bridgeVersion: 1,
            status: "ok",
            diagnostics: [
              createHelperDiagnostics(["/helper", "set-exposure", "1.25"])
            ],
            wait: {
              mode: "until-render",
              timeoutMilliseconds: 1500,
              pollIntervalMilliseconds: 100,
              latestObservedRenderSequence: 11,
              completed: false,
              timedOut: true
            },
            setExposure: {
              requested: 1.25,
              previous: 0,
              current: 0,
              requestedRenderSequence: 12
            },
            session: {
              view: "darkroom",
              renderSequence: 11
            },
            activeImage: {
              sourceAssetPath: "/asset.ARW"
            },
            exposure: {
              current: 0
            }
          }
        })
      )
    ).toThrow("live-set-exposure timed out instead of completing against the fixed helper.");
  });

  test("rejects contaminated initial exposure that already matches the request", (): void => {
    expect(() =>
      validateLiveSmoke(
        createInput({
          firstSession: createSessionPayload({
            requestId: "req-1",
            renderSequence: 10,
            currentExposure: 1.25
          }),
          mutation: {
            requestId: "req-2",
            bridgeVersion: 1,
            status: "ok",
            diagnostics: [
              createHelperDiagnostics(["/helper", "set-exposure", "1.25"])
            ],
            wait: {
              mode: "until-render",
              timeoutMilliseconds: 1500,
              pollIntervalMilliseconds: 100,
              latestObservedRenderSequence: 12,
              completed: true,
              timedOut: false
            },
            setExposure: {
              requested: 1.25,
              previous: 1.25,
              current: 1.25,
              requestedRenderSequence: 12
            },
            session: {
              view: "darkroom",
              renderSequence: 12
            },
            activeImage: {
              sourceAssetPath: "/asset.ARW"
            },
            exposure: {
              current: 1.25
            }
          },
          secondSession: createSessionPayload({
            requestId: "req-3",
            renderSequence: 12,
            currentExposure: 1.25
          })
        })
      )
    ).toThrow("live-set-exposure started at the requested exposure, so the smoke run did not prove a real mutation.");
  });
});

function createInput(
  overrides: Partial<{
    firstSession: Record<string, unknown>;
    mutation: Record<string, unknown>;
    secondSession: Record<string, unknown>;
  }> = {}
): ValidateLiveSmokeInput {
  return {
    firstSession:
      overrides.firstSession ??
      createSessionPayload({ requestId: "req-1", renderSequence: 10, currentExposure: 0 }),
    mutation:
      overrides.mutation ??
      ({
        requestId: "req-2",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [createHelperDiagnostics(["/helper", "set-exposure", "1.25"])],
        wait: {
          mode: "until-render",
          timeoutMilliseconds: 1500,
          pollIntervalMilliseconds: 100,
          latestObservedRenderSequence: 12,
          completed: true,
          timedOut: false
        },
        setExposure: {
          requested: 1.25,
          previous: 0,
          current: 1.25,
          requestedRenderSequence: 12
        },
        session: {
          view: "darkroom",
          renderSequence: 12
        },
        activeImage: {
          sourceAssetPath: "/asset.ARW"
        },
        exposure: {
          current: 1.25
        }
      }),
    secondSession:
      overrides.secondSession ??
      createSessionPayload({ requestId: "req-3", renderSequence: 12, currentExposure: 1.25 }),
    assetPath: "/asset.ARW",
    liveBridgePath: "/helper",
    requestedExposure: 1.25,
    setTimeoutMilliseconds: 1500,
    setPollIntervalMilliseconds: 100,
    floatTolerance: 0.000001
  };
}

function createSessionPayload(input: {
  requestId: string;
  renderSequence: number;
  currentExposure: number;
}): Record<string, unknown> {
  return {
    requestId: input.requestId,
    bridgeVersion: 1,
    status: "ok",
    diagnostics: createHelperDiagnostics(["/helper", "get-session"]),
    session: {
      view: "darkroom",
      renderSequence: input.renderSequence
    },
    activeImage: {
      sourceAssetPath: "/asset.ARW"
    },
    exposure: {
      current: input.currentExposure
    }
  };
}

function createHelperDiagnostics(commandArguments: ReadonlyArray<string>): Record<string, unknown> {
  return {
    helperBinaryPath: "/helper",
    commandArguments,
    exitCode: 0,
    elapsedMilliseconds: 8
  };
}

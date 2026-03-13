import type {
  LiveDarktableSetExposureResult,
  LiveDarktableSetExposureWaitOutcome,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import type {
  LiveDarktableSessionGateway,
  SetLiveDarktableExposureRequest as GatewaySetLiveDarktableExposureRequest
} from "../ports/live-darktable-session-gateway";
import type { Clock } from "../ports/clock";
import type { Sleeper } from "../ports/sleeper";

export type SetLiveDarktableExposureRequest =
  | {
      readonly exposure: number;
      readonly wait: {
        readonly mode: "none";
      };
    }
  | {
      readonly exposure: number;
      readonly wait: {
        readonly mode: "until-render";
        readonly timeoutMilliseconds: number;
        readonly pollIntervalMilliseconds: number;
      };
    };

export class SetLiveDarktableExposure {
  public constructor(
    private readonly gateway: LiveDarktableSessionGateway,
    private readonly clock: Clock,
    private readonly sleeper: Sleeper
  ) {}

  public async execute(
    request: SetLiveDarktableExposureRequest
  ): Promise<LiveDarktableSetExposureResult> {
    const mutationRequest: GatewaySetLiveDarktableExposureRequest = {
      exposure: request.exposure
    };
    const mutation = await this.gateway.setExposure(mutationRequest);
    const helperCallDiagnostics = [mutation.diagnostics];

    if (request.wait.mode === "none" || mutation.status === "unavailable") {
      return {
        mutation,
        latestSession: mutation,
        helperCallDiagnostics,
        wait: this.buildNoWaitOutcome(mutation.status === "ok" ? mutation.exposure.requestedRenderSequence : undefined)
      };
    }

    const targetRenderSequence = mutation.exposure.requestedRenderSequence;

    if (mutation.session.renderSequence >= targetRenderSequence) {
      return {
        mutation,
        latestSession: mutation,
        helperCallDiagnostics,
        wait: this.buildCompletedOutcome(
          request.wait,
          targetRenderSequence,
          mutation.session.renderSequence,
          0,
          false
        )
      };
    }

    let pollCount = 0;
    let latestSession: LiveDarktableSessionSnapshot = mutation;
    const deadline = this.clock.now().getTime() + request.wait.timeoutMilliseconds;
    let timedOut = false;

    do {
      await this.sleeper.sleep(request.wait.pollIntervalMilliseconds);
      pollCount += 1;
      latestSession = await this.gateway.getSession();
      helperCallDiagnostics.push(latestSession.diagnostics);

      if (latestSession.status === "ok" && latestSession.session.renderSequence >= targetRenderSequence) {
        return {
          mutation,
          latestSession,
          helperCallDiagnostics,
          wait: this.buildCompletedOutcome(
            request.wait,
            targetRenderSequence,
            latestSession.session.renderSequence,
            pollCount,
            false
          )
        };
      }

      timedOut = this.clock.now().getTime() >= deadline;
    } while (!timedOut);

    return {
      mutation,
      latestSession,
      helperCallDiagnostics,
      wait: this.buildCompletedOutcome(
        request.wait,
        targetRenderSequence,
        latestSession.status === "ok" ? latestSession.session.renderSequence : undefined,
        pollCount,
        true
      )
    };
  }

  private buildNoWaitOutcome(targetRenderSequence: number | undefined): LiveDarktableSetExposureWaitOutcome {
    return {
      mode: "none",
      ...(targetRenderSequence === undefined ? {} : { targetRenderSequence }),
      pollCount: 0,
      completed: true,
      timedOut: false
    };
  }

  private buildCompletedOutcome(
    wait: Extract<SetLiveDarktableExposureRequest["wait"], { readonly mode: "until-render" }>,
    targetRenderSequence: number,
    latestObservedRenderSequence: number | undefined,
    pollCount: number,
    timedOut: boolean
  ): LiveDarktableSetExposureWaitOutcome {
    return {
      mode: "until-render",
      targetRenderSequence,
      ...(latestObservedRenderSequence === undefined ? {} : { latestObservedRenderSequence }),
      pollCount,
      completed: !timedOut,
      timedOut,
      timeoutMilliseconds: wait.timeoutMilliseconds,
      pollIntervalMilliseconds: wait.pollIntervalMilliseconds
    };
  }
}

export type CliInvocation =
  | HelpCliInvocation
  | SmokeCliInvocation
  | RenderPreviewCliInvocation
  | CapabilitiesCliInvocation
  | LiveSessionInfoCliInvocation
  | LiveSetExposureCliInvocation;

export interface HelpCliInvocation {
  readonly kind: "help";
}

export interface SmokeCliInvocation {
  readonly kind: "smoke";
  readonly fixtureId: string;
}

export interface RenderPreviewCliInvocation {
  readonly kind: "render-preview";
  readonly recipeFilePath: string;
}

export interface CapabilitiesCliInvocation {
  readonly kind: "capabilities";
}

export interface LiveSessionInfoCliInvocation {
  readonly kind: "live-session-info";
}

export type LiveSetExposureCliInvocation =
  | {
      readonly kind: "live-set-exposure";
      readonly exposure: number;
      readonly wait: {
        readonly mode: "none";
      };
    }
  | {
      readonly kind: "live-set-exposure";
      readonly exposure: number;
      readonly wait: {
        readonly mode: "until-render";
        readonly timeoutMilliseconds: number;
        readonly pollIntervalMilliseconds: number;
      };
    };

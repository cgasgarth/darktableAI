export type CliInvocation =
  | HelpCliInvocation
  | SmokeCliInvocation
  | RenderPreviewCliInvocation
  | CapabilitiesCliInvocation
  | LiveSessionInfoCliInvocation
  | LiveSessionSnapshotCliInvocation
  | LiveSetExposureCliInvocation
  | LiveModuleInstanceActionCliInvocation;

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

export interface LiveSessionSnapshotCliInvocation {
  readonly kind: "live-session-snapshot";
}

export type LiveModuleInstanceActionCliInvocation =
    | {
        readonly kind: "live-module-instance-action";
        readonly instanceKey: string;
        readonly action: "enable" | "disable" | "create" | "duplicate" | "delete";
      }
  | {
      readonly kind: "live-module-instance-action";
      readonly instanceKey: string;
      readonly action: "move-before" | "move-after";
      readonly anchorInstanceKey: string;
    };

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

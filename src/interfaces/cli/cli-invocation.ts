export type CliInvocation =
  | HelpCliInvocation
  | SmokeCliInvocation
  | RenderPreviewCliInvocation
  | CapabilitiesCliInvocation;

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

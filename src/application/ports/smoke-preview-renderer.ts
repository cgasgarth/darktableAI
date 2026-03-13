import type { SmokePreviewRequest, SmokePreviewResult } from "../models/render-artifacts";

export interface SmokePreviewRenderer {
  renderSmokePreview(request: SmokePreviewRequest): Promise<SmokePreviewResult>;
}

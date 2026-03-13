import type { PreviewRenderRequest, PreviewRenderResult } from "../models/render-artifacts";

export interface PreviewRenderer {
  renderPreview(request: PreviewRenderRequest): Promise<PreviewRenderResult>;
}

import type {
  ManifestSaveRequest,
  RenderManifest
} from "../models/render-artifacts";

export interface ManifestRepository {
  getManifestPath(manifestId: string): string;
  saveManifest<TManifest extends RenderManifest>(request: ManifestSaveRequest<TManifest>): Promise<TManifest>;
}

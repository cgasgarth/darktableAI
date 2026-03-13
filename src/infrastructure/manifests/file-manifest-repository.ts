import { LocalRunLayout } from "../runtime/local-run-layout";

import type {
  ManifestSaveRequest,
  RenderManifest
} from "../../application/models/render-artifacts";
import type { ManifestRepository } from "../../application/ports/manifest-repository";

export class FileManifestRepository implements ManifestRepository {
  public constructor(private readonly runLayout: LocalRunLayout = new LocalRunLayout()) {}

  public getManifestPath(manifestId: string): string {
    return this.runLayout.getManifestPath(manifestId);
  }

  public async saveManifest<TManifest extends RenderManifest>(
    request: ManifestSaveRequest<TManifest>
  ): Promise<TManifest> {
    const manifestPayload = JSON.stringify(request.manifest, this.serializeValueReplacer, 2);

    await Bun.write(request.manifest.manifestPath, manifestPayload);

    return request.manifest;
  }

  private readonly serializeValueReplacer = (_key: string, value: unknown): unknown => {
    void _key;
    return value instanceof Date ? value.toISOString() : value;
  };
}

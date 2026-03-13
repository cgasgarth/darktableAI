import { describe, expect, test } from "bun:test";

import { RunDarktableSmokeCommand } from "./run-darktable-smoke-command";
import type {
  RunDarktableSmokeTestRequest,
  RunDarktableSmokeTestResult
} from "../../application/use-cases/run-darktable-smoke-test";

describe("RunDarktableSmokeCommand", () => {
  test("returns manifest and source paths on success", async () => {
    const command = new RunDarktableSmokeCommand(new StubRunDarktableSmokeTest());

    const result = await command.execute({
      requestId: "request-1",
      fixtureId: "sample-fixture"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-1",
        status: "ok",
        fixtureId: "sample-fixture",
        manifestId: "manifest-1",
        manifestPath: "/artifacts/manifests/manifest-1.json",
        outputImagePath: "/artifacts/smoke/manifest-1-smoke.jpg",
        sourceAssetPath: "/fixtures/source.ARW",
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1",
            configDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/library.db"
          },
          exitCode: 0
        }
      }
    });
  });
});

class StubRunDarktableSmokeTest {
  public execute(_request: RunDarktableSmokeTestRequest): Promise<RunDarktableSmokeTestResult> {
    void _request;

    return Promise.resolve({
      status: "ok",
      fixture: {
        fixtureId: "sample-fixture",
        sourceAssetPath: "/fixtures/source.ARW",
        description: "Sample fixture"
      },
      manifest: {
        kind: "smoke",
        manifestId: "manifest-1",
        manifestPath: "/artifacts/manifests/manifest-1.json",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        sourceAssetPath: "/fixtures/source.ARW",
        outputImagePath: "/artifacts/smoke/manifest-1-smoke.jpg",
        requestedAt: new Date("2026-01-01T00:00:00.000Z"),
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1",
            configDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/library.db"
          },
          exitCode: 0
        },
        fixtureId: "sample-fixture",
        smokeTestId: "smoke-1",
        smokeStartedAt: new Date("2026-01-01T00:00:01.000Z"),
        smokeCompletedAt: new Date("2026-01-01T00:00:02.000Z")
      },
      smokePreviewResult: {
        manifestId: "manifest-1",
        smokeTestId: "smoke-1",
        outputImagePath: "/artifacts/smoke/manifest-1-smoke.jpg",
        startedAt: new Date("2026-01-01T00:00:01.000Z"),
        completedAt: new Date("2026-01-01T00:00:02.000Z"),
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1",
            configDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/library.db"
          },
          exitCode: 0
        }
      }
    });
  }
}

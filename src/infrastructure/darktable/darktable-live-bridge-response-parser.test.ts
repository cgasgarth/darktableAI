import { describe, expect, test } from "bun:test";

import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

const diagnostics = {
  helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
  commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-session"],
  exitCode: 0,
  elapsedMilliseconds: 12
} as const;

describe("DarktableLiveBridgeResponseParser", (): void => {
  test("parses available get-session payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    const result = parser.parseGetSession(
      JSON.stringify({
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 14,
          historyChangeSequence: 9,
          imageLoadSequence: 3
        },
        activeImage: {
          imageId: 42,
          directoryPath: "/photos/session",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/session/frame.ARW"
        },
        exposure: {
          current: 0.25
        }
      }),
      diagnostics
    );

    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 14,
        historyChangeSequence: 9,
        imageLoadSequence: 3
      },
      activeImage: {
        imageId: 42,
        directoryPath: "/photos/session",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/session/frame.ARW"
      },
      exposure: {
        current: 0.25
      }
    });
  });

  test("parses unavailable payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(
      parser.parseGetSession(
        JSON.stringify({
          bridgeVersion: 1,
          status: "unavailable",
          reason: "unsupported-view"
        }),
        diagnostics
      )
    ).toEqual({
      bridgeVersion: 1,
      status: "unavailable",
      reason: "unsupported-view",
      diagnostics
    });
  });

  test("parses set-exposure payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    const result = parser.parseSetExposure(
      JSON.stringify({
        bridgeVersion: 1,
        status: "ok",
        session: {
          view: "darkroom",
          renderSequence: 15,
          historyChangeSequence: 10,
          imageLoadSequence: 3
        },
        exposure: {
          previous: 0,
          requested: 1,
          current: 1,
          requestedRenderSequence: 16
        }
      }),
      diagnostics
    );

    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      diagnostics,
      session: {
        view: "darkroom",
        renderSequence: 15,
        historyChangeSequence: 10,
        imageLoadSequence: 3
      },
      exposure: {
        previous: 0,
        requested: 1,
        current: 1,
        requestedRenderSequence: 16
      }
    });
  });

  test("rejects malformed helper payloads", (): void => {
    const parser = new DarktableLiveBridgeResponseParser();

    expect(() =>
      parser.parseSetExposure(
        JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 15,
            historyChangeSequence: 10,
            imageLoadSequence: 3
          },
          exposure: {
            previous: 0,
            requested: 1,
            current: 1,
            requestedRenderSequence: 16.5
          }
        }),
        diagnostics
      )
    ).toThrow("darktable-live-bridge field 'exposure.requestedRenderSequence' must be an integer.");
  });
});

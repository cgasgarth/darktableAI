import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge", (): void => {
  test("invokes get-session and attaches process diagnostics", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 21,
            historyChangeSequence: 8,
            imageLoadSequence: 2
          },
          exposure: {
            current: -0.2
          }
        }),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      processRunner,
      undefined,
      createNowMilliseconds([1000, 1017])
    );

    const result = await bridge.getSession();

    expect(processRunner.commands).toEqual([
      ["/opt/darktable/build/bin/darktable-live-bridge", "get-session"]
    ]);
    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      session: {
        view: "darkroom",
        renderSequence: 21,
        historyChangeSequence: 8,
        imageLoadSequence: 2
      },
      exposure: {
        current: -0.2
      },
      diagnostics: {
        helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
        commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-session"],
        exitCode: 0,
        elapsedMilliseconds: 17
      }
    });
  });

  test("surfaces transport failures as integration errors", async (): Promise<void> => {
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      new StubProcessRunner([
        {
          exitCode: 7,
          stdout: "",
          stderr: "socket closed"
        }
      ]),
      undefined,
      createNowMilliseconds([2000, 2003])
    );

    try {
      await bridge.getSession();
      throw new Error("Expected bridge transport failure.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "darktable-live-bridge failed (code=7; command=/opt/darktable/build/bin/darktable-live-bridge get-session): socket closed"
      );
    }
  });

  test("rejects malformed successful payloads", async (): Promise<void> => {
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      new StubProcessRunner([
        {
          exitCode: 0,
          stdout: JSON.stringify({
            bridgeVersion: 1,
            status: "ok",
            session: {
              view: "darkroom",
              renderSequence: 21,
              historyChangeSequence: 8,
              imageLoadSequence: "bad"
            }
          }),
          stderr: ""
        }
      ]),
      undefined,
      createNowMilliseconds([3000, 3001])
    );

    try {
      await bridge.getSession();
      throw new Error("Expected malformed payload failure.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "darktable-live-bridge field 'session.imageLoadSequence' must be a finite number."
      );
    }
  });
});

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(private readonly responses: ReadonlyArray<DarktableCliProcessResult>) {}

  public run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    this.commands.push([...command]);
    const response = this.responses[this.commands.length - 1];

    if (response === undefined) {
      throw new Error("No configured process response.");
    }

    return Promise.resolve(response);
  }
}

function createNowMilliseconds(values: ReadonlyArray<number>): () => number {
  let index = 0;

  return (): number => {
    const value = values[index];

    if (value === undefined) {
      throw new Error("No configured timestamp.");
    }

    index += 1;
    return value;
  };
}

export interface DarktableCliProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface DarktableCliProcessRunner {
  run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult>;
}

export class BunDarktableCliProcessRunner implements DarktableCliProcessRunner {
  public async run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    const process = Bun.spawn([...command], {
      stderr: "pipe",
      stdout: "pipe"
    });

    const exitCode = await process.exited;
    const stdout = new TextDecoder().decode(await new Response(process.stdout).arrayBuffer());
    const stderr = new TextDecoder().decode(await new Response(process.stderr).arrayBuffer());

    return {
      exitCode,
      stdout,
      stderr
    };
  }
}

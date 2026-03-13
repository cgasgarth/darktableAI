export interface CliCommand<TInput, TOutput> {
  execute(input: TInput): Promise<CliCommandResult<TOutput>>;
}

export type CliCommandResult<TOutput> =
  | CliCommandSuccess<TOutput>
  | CliCommandFailure;

export interface CliCommandSuccess<TOutput> {
  readonly ok: true;
  readonly output: TOutput;
}

export interface CliCommandFailure {
  readonly ok: false;
  readonly error: string;
}

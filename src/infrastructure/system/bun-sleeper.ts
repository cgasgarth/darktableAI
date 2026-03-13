import type { Sleeper } from "../../application/ports/sleeper";

export class BunSleeper implements Sleeper {
  public sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve: () => void): void => {
      setTimeout(resolve, milliseconds);
    });
  }
}

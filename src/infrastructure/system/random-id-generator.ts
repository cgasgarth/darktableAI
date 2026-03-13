import type { IdGenerator } from "../../application/ports/id-generator";

export class RandomIdGenerator implements IdGenerator {
  public generate(): string {
    return crypto.randomUUID();
  }
}

import { listAdjustmentCapabilities } from "../../contracts/adjustment-capability";
import { listDarktableNativeCapabilities } from "../../contracts/darktable-native-capability";
import type { AdjustmentCapabilitiesResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

export type RunAdjustmentCapabilitiesCommandInput = Record<never, never>;

export class RunAdjustmentCapabilitiesCommand
  implements CliCommand<RunAdjustmentCapabilitiesCommandInput, AdjustmentCapabilitiesResponse>
{
  public execute(
    _input: RunAdjustmentCapabilitiesCommandInput
  ): Promise<CliCommandResult<AdjustmentCapabilitiesResponse>> {
    void _input;

    return Promise.resolve({
      ok: true,
      output: {
        adjustments: listAdjustmentCapabilities(),
        darktableNative: listDarktableNativeCapabilities()
      }
    });
  }
}

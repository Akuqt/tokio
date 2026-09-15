import { parse, stringify } from "yaml";
import { BaseFileManagerService } from "../shared";

export class YAMLManagerService extends BaseFileManagerService {
  protected fileType = "yaml";

  protected serialize(data: unknown): string {
    return stringify(data);
  }

  protected deserialize(content: string): unknown {
    return parse(content);
  }
}

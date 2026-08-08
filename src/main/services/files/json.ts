import { LoggerOptions } from "@/common/types";
import { formatError } from "@/common/util";
import { cleanText } from "@/helper";
import Logger from "@/logger";
import { promises as fs } from "fs";
import { z } from "zod";
import { LoggerService } from "../shared";

export class JsonManagerService extends LoggerService {
  constructor() {
    super();
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  async saveFile<T>(
    filePath: string,
    schema: z.ZodType<T>,
    data: T,
  ): Promise<boolean> {
    const tempPath = `${filePath}.tmp`;
    try {
      const validation = schema.safeParse(data);

      if (!validation.success) {
        Logger.error(
          `<System> Schema validation failed while saving json file ${filePath} -- ${cleanText(z.prettifyError(validation.error))}}`,
          this._logSettings,
        );
        return false;
      }

      const jsonString = JSON.stringify(data, null, 2);

      await fs.writeFile(tempPath, jsonString, "utf-8");

      await fs.rename(tempPath, filePath);

      return true;
    } catch (error) {
      if (error instanceof SyntaxError) {
        Logger.error(
          `<System> Schema validation failed while saving json file ${filePath} -- ${formatError(error)}`,
          this._logSettings,
        );
      } else {
        Logger.error(
          `<System> Unable to save json file ${filePath} -- ${formatError(error)}`,
          this._logSettings,
        );
        await fs.unlink(tempPath).catch(() => {});
      }
      return false;
    }
  }

  async loadFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");

      const rawJson = JSON.parse(fileContent);

      const validation = schema.safeParse(rawJson);

      if (!validation.success) {
        Logger.error(
          `<System> Schema validation failed while loading json file ${filePath} -- ${cleanText(z.prettifyError(validation.error))}}`,
          this._logSettings,
        );
        return null;
      }

      return validation.data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        Logger.error(
          `<System> Schema validation failed while loading json file ${filePath} -- ${formatError(error)}`,
          this._logSettings,
        );
      } else {
        Logger.error(
          `<System> Unable to load json file ${filePath} -- ${formatError(error)}`,
          this._logSettings,
        );
      }
      return null;
    }
  }

  async updateProfile<T>(
    filePath: string,
    schema: z.ZodType<T>,
    updates: Partial<T>,
  ): Promise<boolean> {
    const existingData = await this.loadFile(filePath, schema);
    if (!existingData) {
      Logger.error(
        `<System> Unable to update json file ${filePath} -- ${formatError(new Error("File does not exist or is invalid."))}`,
        this._logSettings,
      );
      return false;
    }
    const mergedData = this._deepMerge(existingData, updates);
    return this.saveFile(filePath, schema, mergedData);
  }

  private _deepMerge(target: any, source: any): any {
    const isObject = (obj: any) =>
      obj && typeof obj === "object" && !Array.isArray(obj);

    if (!isObject(target) || !isObject(source)) {
      return source;
    }

    const output = { ...target };

    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = this._deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }
}

import { formatError } from "@/common/util";
import { cleanText } from "@/helper";
import Logger from "@/logger";
import { promises as fs } from "fs";
import { z } from "zod";
import { Service } from "../shared";

export class JSONManagerService extends Service {
  private _writeLocks: Map<string, Promise<any>> = new Map();

  public setLogFile(logFile: string) {
    this._logFile = logFile;
  }

  public async saveFile<T>(
    filePath: string,
    schema: z.ZodType<T>,
    data: T,
  ): Promise<boolean> {
    const tempPath = `${filePath}.tmp`;
    try {
      const validation = schema.safeParse(data);

      if (!validation.success) {
        Logger.error(
          `<System> Schema validation failed while saving json file ${filePath} -- ${cleanText(z.prettifyError(validation.error))}`,
          this._logFile,
        );
        return false;
      }

      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonString, "utf-8");
      await fs.rename(tempPath, filePath);

      return true;
    } catch (error) {
      if (error instanceof TypeError) {
        Logger.error(
          `<System> Data serialization failed for ${filePath} -- ${formatError(error)}`,
          this._logFile,
        );
      } else {
        Logger.error(
          `<System> Unable to save json file ${filePath} -- ${formatError(error)}`,
          this._logFile,
        );
      }
      await fs.unlink(tempPath).catch(() => {});
      return false;
    }
  }

  public async loadFile<T>(
    filePath: string,
    schema: z.ZodType<T>,
  ): Promise<T | null> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const rawJson = JSON.parse(fileContent);

      const validation = schema.safeParse(rawJson);

      if (!validation.success) {
        console.log(rawJson);
        console.log(validation.error);

        Logger.error(
          `<System> Schema validation failed while loading json file ${filePath} -- ${cleanText(z.prettifyError(validation.error))}`,
          this._logFile,
        );
        return null;
      }

      return validation.data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        Logger.error(
          `<System> Malformed JSON in file ${filePath} -- ${formatError(error)}`,
          this._logFile,
        );
      } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      } else {
        Logger.error(
          `<System> Unable to load json file ${filePath} -- ${formatError(error)}`,
          this._logFile,
        );
      }
      return null;
    }
  }

  public async updateFile<T>(
    filePath: string,
    schema: z.ZodType<T>,
    updates: Partial<T>,
  ): Promise<boolean> {
    const currentLock = this._writeLocks.get(filePath) || Promise.resolve();

    const updatePromise = currentLock.then(async () => {
      const existingData = await this.loadFile(filePath, schema);
      if (!existingData) {
        Logger.error(
          `<System> Unable to update json file ${filePath} -- File does not exist or is invalid.`,
          this._logFile,
        );
        return false;
      }
      const mergedData = this._deepMerge(existingData, updates);
      return this.saveFile(filePath, schema, mergedData);
    });

    this._writeLocks.set(filePath, updatePromise);

    try {
      return await updatePromise;
    } finally {
      if (this._writeLocks.get(filePath) === updatePromise) {
        this._writeLocks.delete(filePath);
      }
    }
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

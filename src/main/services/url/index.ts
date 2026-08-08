import { LoggerOptions } from "@/common/types";
import { formatError } from "@/common/util";
import config from "@/config";
import Logger from "@/logger";
import { exec } from "@vscode/sudo-prompt";
import fs from "fs";
import { join, resolve } from "path";
import { LoggerService } from "../shared";

export class URLManagerService extends LoggerService {
  private _port: number;

  constructor() {
    super();
    this._port = 6767;
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  public setPort(port: number) {
    this._port = port;
  }

  public getURL(id: string) {
    return `https://${config.CMD.FQDN}:${this._port}/${id}/`;
  }

  public installAppFQDN() {
    const hostsFilePath = resolve(join(...config.CMD.HOST));

    const TEMPLATE = [
      "## Tokio App Hostname - Start ##",
      `${config.CMD.IP} ${config.CMD.FQDN}`,
      "## Tokio App Hostname - End ##",
    ];

    try {
      const hostsContent = fs.readFileSync(hostsFilePath, "utf-8");
      if (hostsContent.includes(config.CMD.FQDN)) {
        return;
      } else {
        let command = `echo.>> ${hostsFilePath}\n`;
        for (let i = 0; i < TEMPLATE.length; i++) {
          command += `echo ${TEMPLATE[i]}>> ${hostsFilePath}${i < TEMPLATE.length - 1 ? "\n" : ""}`;
        }
        const options = {
          name: config.CMD.NAME,
        };
        Logger.info(
          `<System> Prompting for admin rights to add ${config.CMD.FQDN} to the hosts file.`,
          this._logSettings,
        );
        exec(command, options, (error) => {
          if (error) {
            Logger.error(
              `<System> Failed to modify hosts file -- ${formatError(error)}`,
              this._logSettings,
            );
            return;
          }
          Logger.success(
            "<System> Successfully updated hosts file.",
            this._logSettings,
          );
        });
      }
    } catch (error) {
      Logger.error(
        `<System> Unable to read hosts file -- ${formatError(error)}`,
        this._logSettings,
      );
    }
  }
}

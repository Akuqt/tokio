import { LoggerOptions } from "@/common/types";
import chalk from "chalk";
import { appendFile } from "node:fs";

export default class Logger {
  private static log(
    tag: string,
    msg: string,
    color: { r: number; g: number; b: number },
    options?: LoggerOptions,
  ) {
    const cmsg = `${Logger.gen_date()} -- ${chalk.rgb(color.r, color.g, color.b)(tag)} ${msg}`;
    if (options && options.file) {
      const fmsg = `${Logger.gen_date()} -- ${tag} ${msg}`;
      appendFile(options.path, fmsg, "utf-8", (err) => {
        if (err) throw err;
      });
    }
    console.log(cmsg);
  }

  private static gen_date() {
    return new Date().toLocaleString("en", {
      timeZone: "UTC",
    });
  }

  public static info(msg: string, options?: LoggerOptions) {
    const tag = "[INFO]:";
    this.log(tag, msg, { r: 112, g: 214, b: 255 }, options);
  }
  public static warn(msg: string, options?: LoggerOptions) {
    const tag = "[WARN]:";
    this.log(tag, msg, { r: 255, g: 214, b: 112 }, options);
  }
  public static success(msg: string, options?: LoggerOptions) {
    const tag = "[SUCCESS]:";
    this.log(tag, msg, { r: 99, g: 227, b: 156 }, options);
  }
  public static error(msg: string, options?: LoggerOptions) {
    const tag = "[ERROR]:";
    this.log(tag, msg, { r: 238, g: 91, b: 65 }, options);
  }
}

import { appendFile } from "node:fs";

export default class Logger {
  private static log(tag: string, msg: string, logFile?: string) {
    const cmsg = `${Logger.gen_date()} -- ${tag} ${msg}`;
    if (logFile && logFile !== "") {
      const fmsg = `${Logger.gen_date()} -- ${tag} ${msg}\n`;
      appendFile(logFile, fmsg, "utf-8", (err) => {
        if (err) throw err; // TODO: Check later
      });
    }
    console.log(cmsg);
  }

  private static gen_date() {
    return new Date().toISOString();
  }

  public static info(msg: string, logFile?: string) {
    const tag = "[INFO]:";
    this.log(tag, msg, logFile);
  }
  public static warn(msg: string, logFile?: string) {
    const tag = "[WARN]:";
    this.log(tag, msg, logFile);
  }
  public static success(msg: string, logFile?: string) {
    const tag = "[SUCCESS]:";
    this.log(tag, msg, logFile);
  }
  public static error(msg: string, logFile?: string) {
    const tag = "[ERROR]:";
    this.log(tag, msg, logFile);
  }
}

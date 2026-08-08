export abstract class Service {
  protected _logFile: string;
  public abstract setLogFile(logFile: string): void;
}

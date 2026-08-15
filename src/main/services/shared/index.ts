import { Provider } from "@/common/types";

export abstract class Service {
  protected _logFile: string;
  public abstract setLogFile(logFile: string): void;
}

export abstract class ProviderService<T> extends Service {
  protected _current:
    { name: string; provider: T | null; key: string } | undefined;
  protected _providerPool: Map<string, T> | undefined;
  abstract addProvider(name: string, provider: T, start?: boolean): void;
  abstract setProvider(name: string, key?: string): void;
  abstract getProviders(): Provider[];
  abstract setKey(key: string): void;
}

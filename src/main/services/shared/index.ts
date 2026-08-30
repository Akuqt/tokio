import { Provider } from "@/common/types";

export abstract class Service {
  protected _logFile: string;
  public abstract setLogFile(logFile: string): void;
}

interface IProvider {
  setKey(key: string): void;
}

export abstract class ProviderServiceBase<T>
  extends Service
  implements IProvider
{
  protected _current:
    { name: string; provider: T | null; key: string } | undefined;
  protected _providerPool: Map<string, T> | undefined;
  abstract addProvider(name: string, provider: T, start?: boolean): void;
  abstract setProvider(name: string, key?: string): void;
  abstract getProviders(): Provider[];
  abstract setKey(key: string): void;
}

export class ProviderService<
  T extends IProvider,
> extends ProviderServiceBase<T> {
  constructor() {
    super();
    this._current = {
      name: "",
      key: "",
      provider: null,
    };
    this._providerPool = new Map();
  }

  public addProvider(name: string, provider: T, start?: boolean) {
    if (!this._validProvider(provider)) return;
    this._providerPool?.set(name, provider);
    if (start) {
      this.setProvider(name);
    }
  }

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public setKey(key: string): void {
    if (this._current?.provider) this._current.provider.setKey(key);
  }

  public setProvider(name: string, key?: string) {
    const provider = this._providerPool?.get(name);
    if (!provider) return;
    this._current = { name, provider, key: key || "" };
    this.setKey(key || "");
  }

  public getProviders(): Provider[] {
    const providers = this._providerPool?.keys().toArray() || [];
    return providers.map((s) => ({
      name: s,
      active: s == this._current?.name,
      key: this._current?.key || "",
    }));
  }

  public getActiveProvider(): Provider | null {
    if (!this._current) return null;
    return {
      name: this._current?.name,
      active: true,
      key: this._current?.key,
    };
  }

  // NOTE: MUST Override this in the child class!
  protected _validProvider(_provider: T) {
    return false;
  }
}

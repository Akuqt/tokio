import {
  AppProvider,
  AppSettings,
  EntityMetadata,
  ProfileSchema,
  StoreSchema,
  StoreZodSchema,
  ThemeSchema,
} from "@/common/schemas";
import { THEME_MODE } from "@/common/types";
import { defaultProfile, defaultTheme, formatError } from "@/common/util";
import { defaultStoreData } from "@/common/util/constants/store";
import Logger from "@/logger";
import { JSONManagerService, PathManagerService } from "@/services";
import { safeStorage } from "electron";
import { EventEmitter } from "events";
import { access, copyFile } from "fs/promises";
import { join } from "path";
import { Service } from "../shared";

type DefaultProviders = {
  tts: AppProvider;
  connector: AppProvider;
};

export class StoreManagerService extends Service {
  public readonly events = new EventEmitter();

  private _jsonManagerService!: JSONManagerService;
  private _pathManagerService!: PathManagerService;
  private _storeFilePath!: string;
  private _storeData: StoreSchema | null = null;

  private _saveTimeout: NodeJS.Timeout | null = null;

  public setLogFile(logFile: string) {
    this._logFile = logFile;
  }

  public async initialize(
    storeName: string,
    defaultProviders: DefaultProviders,
    jsonManagerService: JSONManagerService,
    pathManagerService: PathManagerService,
  ): Promise<void> {
    if (this._storeData) return;

    this._pathManagerService = pathManagerService;
    this._jsonManagerService = jsonManagerService;
    this._storeFilePath = join(
      this._pathManagerService.folders.settingsFolder,
      `${storeName}.json`,
    );

    let data: StoreSchema | null = null;
    let storeFileExists = true;

    try {
      await access(this._storeFilePath);
    } catch {
      storeFileExists = false;
    }

    try {
      if (storeFileExists) {
        data = await this._jsonManagerService.loadFile(
          this._storeFilePath,
          StoreZodSchema,
        );
        if (!data) await this._backupCorruptedStore();
      }

      // If file didn't exist or was corrupted, build it cleanly from the explicit constant
      if (!data) {
        await this._generatePhysicalDefaults();

        // 1. Deep clone the hardcoded defaults so we don't mutate the constant
        data = structuredClone(defaultStoreData);

        // 2. Inject your secure providers
        data.settings.providers.tts = this._encryptProviderKey(
          defaultProviders.tts,
        );
        data.settings.providers.connector = this._encryptProviderKey(
          defaultProviders.connector,
        );

        // 3. Save it to disk
        await this._jsonManagerService.saveFile(
          this._storeFilePath,
          StoreZodSchema,
          data,
        );
      }

      this._storeData = data;
      Logger.success(`<System> JSON Store initialized cleanly`, this._logFile);
    } catch (error) {
      Logger.error(
        `<System> Fatal: Unable to initialize JSON store -- ${formatError(error)}`,
        this._logFile,
      );
      throw new Error("Unable to initialize store.", { cause: error });
    }
  }

  private async _generatePhysicalDefaults(): Promise<void> {
    const defaultThemePath = join(
      this._pathManagerService.folders.themesFolder,
      "default.json",
    );
    const defaultProfilePath = join(
      this._pathManagerService.folders.profilesFolder,
      "default.json",
    );

    await Promise.all([
      this._jsonManagerService.saveFile(
        defaultProfilePath,
        ProfileSchema,
        defaultProfile,
      ),
      this._jsonManagerService.saveFile(
        defaultThemePath,
        ThemeSchema,
        defaultTheme,
      ),
    ]);
  }

  public getSettings(): AppSettings {
    this._ensureInitialized();

    const clonedSettings = structuredClone(this._storeData!.settings);

    clonedSettings.providers.tts = this._decryptProviderKey(
      clonedSettings.providers.tts,
    );
    clonedSettings.providers.connector = this._decryptProviderKey(
      clonedSettings.providers.connector,
    );

    return clonedSettings;
  }

  public getProfiles(): EntityMetadata[] {
    this._ensureInitialized();
    return this._storeData!.profiles;
  }

  public getThemes(): EntityMetadata[] {
    this._ensureInitialized();
    return this._storeData!.themes;
  }

  public updateServerSettings(enabled: boolean, port: number): void {
    this._ensureInitialized();
    this._storeData!.settings.server = { enabled, port };
    this._queueSave();
    this.events.emit("settings-changed", this.getSettings());
  }

  public updateAppearance(mode: THEME_MODE, activeThemeFile?: string): void {
    this._ensureInitialized();
    this._storeData!.settings.appearance.mode = mode;
    if (activeThemeFile) {
      this._storeData!.settings.appearance.activeThemeFile = activeThemeFile;
    }
    this._queueSave();
    this.events.emit(
      "appearance-changed",
      this._storeData!.settings.appearance,
    );
  }

  public updateActiveProfile(activeProfileFile: string): void {
    this._ensureInitialized();
    this._storeData!.settings.activeProfileFile = activeProfileFile;
    this._queueSave();
    this.events.emit("profile-changed", activeProfileFile);
  }

  public updateProvider(
    type: "connector" | "tts",
    name: string,
    key?: string,
  ): void {
    this._ensureInitialized();
    if (!name) return;

    this._storeData!.settings.providers[type] = this._encryptProviderKey({
      name,
      key: key || "",
    });
    this._queueSave();
    this.events.emit("providers-changed", this.getSettings().providers);
  }

  public async createNewTheme(
    fileName: string,
    themeName: string,
  ): Promise<string | null> {
    this._ensureInitialized();
    if (!fileName || !themeName) return null;

    const newPath = join(
      this._pathManagerService.folders.themesFolder,
      fileName,
    );
    const newThemeData = { ...defaultTheme, name: themeName };

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ThemeSchema,
      newThemeData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write new theme file: ${fileName}`,
        this._logFile,
      );
      return null;
    }

    return this.addTheme(themeName, fileName);
  }

  public async cloneTheme(
    referenceFileName: string,
    newFileName: string,
    newThemeName: string,
  ): Promise<string | null> {
    this._ensureInitialized();
    if (!referenceFileName || !newFileName || !newThemeName) return null;

    const refPath = join(
      this._pathManagerService.folders.themesFolder,
      referenceFileName,
    );
    const newPath = join(
      this._pathManagerService.folders.themesFolder,
      newFileName,
    );

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ThemeSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Clone failed: Reference theme ${referenceFileName} not found.`,
        this._logFile,
      );
      return null;
    }

    const clonedData = { ...structuredClone(existingData), name: newThemeName };

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ThemeSchema,
      clonedData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write cloned theme file: ${newFileName}`,
        this._logFile,
      );
      return null;
    }

    return this.addTheme(newThemeName, newFileName);
  }

  public async addTheme(name: string, file: string): Promise<string | null> {
    this._ensureInitialized();
    if (!name || !file) return null;

    if (this._storeData!.themes.some((t) => t.file === file)) return file;

    this._storeData!.themes.push({ name, file });
    this._queueSave();
    this.events.emit("themes-updated", this.getThemes());

    return file;
  }

  public async createNewProfile(
    fileName: string,
    profileName: string,
  ): Promise<string | null> {
    this._ensureInitialized();
    if (!fileName || !profileName) return null;

    const newPath = join(
      this._pathManagerService.folders.profilesFolder,
      fileName,
    );
    const newProfileData = { ...defaultProfile, name: profileName };

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ProfileSchema,
      newProfileData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write new profile file: ${fileName}`,
        this._logFile,
      );
      return null;
    }

    return this.addProfile(profileName, fileName);
  }

  public async cloneProfile(
    referenceFileName: string,
    newFileName: string,
    newProfileName: string,
  ): Promise<string | null> {
    this._ensureInitialized();
    if (!referenceFileName || !newFileName || !newProfileName) return null;

    const refPath = join(
      this._pathManagerService.folders.profilesFolder,
      referenceFileName,
    );
    const newPath = join(
      this._pathManagerService.folders.profilesFolder,
      newFileName,
    );

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ProfileSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Clone failed: Reference profile ${referenceFileName} not found.`,
        this._logFile,
      );
      return null;
    }

    const clonedData = {
      ...structuredClone(existingData),
      name: newProfileName,
    };

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ProfileSchema,
      clonedData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write cloned profile file: ${newFileName}`,
        this._logFile,
      );
      return null;
    }

    return this.addProfile(newProfileName, newFileName);
  }

  public async addProfile(name: string, file: string): Promise<string | null> {
    this._ensureInitialized();
    if (!name || !file) return null;

    if (this._storeData!.profiles.some((p) => p.file === file)) return file;

    this._storeData!.profiles.push({ name, file });
    this._queueSave();
    this.events.emit("profiles-updated", this.getProfiles());

    return file;
  }

  private _ensureInitialized() {
    if (!this._storeData)
      throw new Error("StoreManagerService is not initialized.");
  }

  private _queueSave(): void {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(async () => {
      try {
        await this._jsonManagerService.saveFile(
          this._storeFilePath,
          StoreZodSchema,
          this._storeData!,
        );
      } catch (e) {
        Logger.error(
          `<System> Background save failed -- ${formatError(e)}`,
          this._logFile,
        );
      }
      this._saveTimeout = null;
    }, 250);
  }

  private async _backupCorruptedStore() {
    try {
      const corruptedPath = this._storeFilePath.replace(
        ".json",
        ".corrupted.json",
      );
      await copyFile(this._storeFilePath, corruptedPath);
      Logger.info(
        `<System> Backed up corrupted store file to ${corruptedPath}`,
        this._logFile,
      );
    } catch {
      // Next
    }
  }

  private _encryptProviderKey(provider: AppProvider): AppProvider {
    if (!provider.key || !safeStorage?.isEncryptionAvailable()) return provider;
    try {
      const encryptedBuffer = safeStorage.encryptString(provider.key);
      return { ...provider, key: encryptedBuffer.toString("base64") };
    } catch {
      return provider;
    }
  }

  private _decryptProviderKey(provider: AppProvider): AppProvider {
    if (!provider.key || !safeStorage?.isEncryptionAvailable()) return provider;
    try {
      const buffer = Buffer.from(provider.key, "base64");
      return { ...provider, key: safeStorage.decryptString(buffer) };
    } catch {
      return provider;
    }
  }
}

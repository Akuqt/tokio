import {
  AppProvider,
  AppSettings,
  EntityMetadata,
  ProfileSchema,
  StoreSchema,
  StoreZodSchema,
  ThemeSchema,
} from "@/common/schemas";
import { defaultProfile, defaultTheme, formatError } from "@/common/util";
import { defaultStoreData } from "@/common/util/constants/store";
import { cleanText } from "@/helper/chat";
import Logger from "@/logger";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { PathManagerService } from "@/services/path";
import { TTSService } from "@/services/tts";
import { safeStorage } from "electron";
import { EventEmitter } from "events";
import { access, copyFile } from "fs/promises";
import { basename, join, resolve } from "path";
import { Service } from "../shared";

type Providers = {
  tts: TTSService;
  connector: TikTokConnectorService;
};

export class StoreManagerService extends Service {
  public readonly events = new EventEmitter();

  private _jsonManagerService!: JSONManagerService;
  private _pathManagerService!: PathManagerService;
  private _providers!: Providers;
  private _storeFilePath!: string;
  private _storeData: StoreSchema | null = null;

  public setLogFile(logFile: string) {
    this._logFile = logFile;
  }

  public async getProfileData() {
    const bn = this._storeData?.settings.activeProfile.file || "default.json";
    const profile = await this._jsonManagerService.loadFile(
      join(this._pathManagerService.folders.profilesFolder, bn),
      ProfileSchema,
    );
    return profile;
  }

  public async initialize(
    storeName: string,
    providers: Providers,
    jsonManagerService: JSONManagerService,
    pathManagerService: PathManagerService,
  ): Promise<void> {
    if (this._storeData) return;

    this._pathManagerService = pathManagerService;
    this._jsonManagerService = jsonManagerService;
    this._providers = providers;
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

      if (!data) {
        await this._generatePhysicalDefaults();
        data = structuredClone(defaultStoreData);
        await this._jsonManagerService.saveFile(
          this._storeFilePath,
          StoreZodSchema,
          data,
        );
      } else {
        const conn_p = this._decryptProviderKey(
          data.settings.activeConnProvider,
        );
        const tts_p = this._decryptProviderKey(data.settings.activeTTSProvider);
        this._providers.connector.setProvider(conn_p.name, conn_p.key);
        this._providers.tts.setProvider(tts_p.name, tts_p.key);
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

    const tts_providers: AppProvider[] = [];
    const conn_providers: AppProvider[] = [];

    for (const tts_p of clonedSettings.providers.tts) {
      tts_providers.push(this._decryptProviderKey(tts_p));
    }

    for (const conn_p of clonedSettings.providers.connector) {
      conn_providers.push(this._decryptProviderKey(conn_p));
    }

    clonedSettings.activeConnProvider = this._decryptProviderKey(
      clonedSettings.activeConnProvider,
    );
    clonedSettings.activeTTSProvider = this._decryptProviderKey(
      clonedSettings.activeTTSProvider,
    );

    clonedSettings.providers = {
      connector: conn_providers,
      tts: tts_providers,
    };

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

  public async updateServerSettings(
    enabled: boolean,
    port: number,
  ): Promise<void> {
    this._ensureInitialized();
    this._storeData!.settings.server = { enabled, port };
    await this._queueSave();
  }

  public async updateAppearance(
    mode: "dark" | "light",
    activeThemeFile?: string,
  ): Promise<void> {
    this._ensureInitialized();
    this._storeData!.settings.theme_mode = mode;
    if (activeThemeFile) {
      this._storeData!.settings.activeTheme =
        this._storeData?.themes.find((t) => t.file == activeThemeFile) ||
        defaultStoreData.themes[0];
    }
    await this._queueSave();
  }

  public async updateActiveProfile(activeProfileFile: string) {
    this._ensureInitialized();
    this._storeData!.settings.activeProfile =
      this._storeData?.profiles.find((p) => p.file == activeProfileFile) ||
      defaultStoreData.profiles[0];

    await this._queueSave();
  }

  public async updateProvider(
    type: "connector" | "tts",
    name: string,
    key?: string,
  ): Promise<AppProvider | null> {
    this._ensureInitialized();
    let provider: AppProvider | null = null;
    if (!name) return provider;
    provider = this._encryptProviderKey({
      name,
      key: key || "",
      active: true,
    });
    if (type === "tts") {
      this._storeData!.settings.activeTTSProvider = provider;
      this._providers.tts.setProvider(name, key);
    } else {
      this._storeData!.settings.activeConnProvider = provider;
      this._providers.connector.setProvider(name, key);
    }
    await this._queueSave();
    return provider;
  }

  public async createNewProfile(
    fileName: string,
    profileName: string,
  ): Promise<EntityMetadata | null> {
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

    return await this.addProfile({
      file: fileName,
      name: profileName,
    });
  }

  public async exportTheme(ref: string, path: string): Promise<boolean> {
    if (!ref || !path) return false;

    const refPath = join(this._pathManagerService.folders.themesFolder, ref);

    const newPath = resolve(path);

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ThemeSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Clone failed: Reference theme ${ref} not found.`,
        this._logFile,
      );
      return false;
    }

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ThemeSchema,
      existingData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write cloned theme file: ${path}`,
        this._logFile,
      );
      return false;
    }

    return true;
  }

  public async exportProfile(ref: string, path: string): Promise<boolean> {
    if (!ref || !path) return false;

    const refPath = join(this._pathManagerService.folders.profilesFolder, ref);

    const newPath = resolve(path);

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ProfileSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Clone failed: Reference profile ${ref} not found.`,
        this._logFile,
      );
      return false;
    }

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ProfileSchema,
      existingData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write cloned profile file: ${path}`,
        this._logFile,
      );
      return false;
    }

    return true;
  }

  public async importProfile(ref: string): Promise<boolean> {
    if (!ref) return false;

    const refPath = resolve(ref);
    const file = basename(refPath);
    const newPath = join(this._pathManagerService.folders.profilesFolder, file);

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ProfileSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Import failed: Reference profile ${ref} not found.`,
        this._logFile,
      );
      return false;
    }

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ProfileSchema,
      existingData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write imported profile file: ${newPath}`,
        this._logFile,
      );
      return false;
    }

    await this.addProfile({
      file: file,
      name: cleanText(file.split(".")[0]).replace(/_|-|\./, " "),
    });

    return true;
  }

  public async importTheme(ref: string): Promise<boolean> {
    if (!ref) return false;

    const refPath = resolve(ref);
    const file = basename(refPath);
    const newPath = join(this._pathManagerService.folders.themesFolder, file);

    const existingData = await this._jsonManagerService.loadFile(
      refPath,
      ThemeSchema,
    );
    if (!existingData) {
      Logger.error(
        `<System> Import failed: Reference theme ${ref} not found.`,
        this._logFile,
      );
      return false;
    }

    const saved = await this._jsonManagerService.saveFile(
      newPath,
      ThemeSchema,
      existingData,
    );
    if (!saved) {
      Logger.error(
        `<System> Failed to write imported theme file: ${newPath}`,
        this._logFile,
      );
      return false;
    }

    await this.addTheme({
      file: file,
      name: cleanText(file.split(".")[0]).replace(/_|-|\./, " "),
    });

    return true;
  }

  public async cloneProfile(
    referenceFileName: string,
    newFileName: string,
    newProfileName: string,
  ): Promise<EntityMetadata | null> {
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

    return await this.addProfile({
      file: newFileName,
      name: newProfileName,
    });
  }

  public async addProfile(
    profile: EntityMetadata,
  ): Promise<EntityMetadata | null> {
    this._ensureInitialized();
    if (!profile) return null;
    if (this._storeData!.profiles.some((p) => p.file === profile.file))
      return profile;
    this._storeData!.profiles.push(profile);
    await this._queueSave();
    return profile;
  }

  public async addTheme(theme: EntityMetadata): Promise<EntityMetadata | null> {
    this._ensureInitialized();
    if (!theme) return null;
    if (this._storeData!.themes.some((t) => t.file === theme.file))
      return theme;
    this._storeData!.themes.push(theme);
    await this._queueSave();
    return theme;
  }

  private _ensureInitialized() {
    if (!this._storeData)
      throw new Error("StoreManagerService is not initialized.");
  }

  private async _queueSave() {
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

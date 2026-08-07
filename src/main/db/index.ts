import { AppConfig, AppProfile, AppTheme, LoggerOptions } from "@/common/types";
import { formatError } from "@/common/util";
import { JsonFileManager } from "@/files";
import Logger from "@/logger";
import { ProfileSchema, ThemeSchema } from "@/schemas";
import { DataSource } from "typeorm";
import { AppConfigEntity, AppProfileEntity, AppThemeEntity } from "./entities";

export class AppDataBase {
  private _dbPath: string;
  private _fileManager: JsonFileManager;
  private _defaultAppConfig: AppConfig;
  private _dataSource: DataSource | null;
  private _logSettings: LoggerOptions;

  constructor(
    dbPath: string,
    defaults: {
      appConfig: AppConfig;
      fileManager: JsonFileManager;
    },
  ) {
    this._dbPath = dbPath;
    this._fileManager = defaults.fileManager;
    this._defaultAppConfig = defaults.appConfig;
    this._dataSource = null;
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  public async initialize(): Promise<void> {
    try {
      const AppDataSource = new DataSource({
        type: "better-sqlite3",
        database: this._dbPath,
        entities: [AppConfigEntity, AppProfileEntity, AppThemeEntity],
        synchronize: true,
      });
      this._dataSource = await AppDataSource.initialize();
      await this.initializeTables();
      Logger.success(`<System> Sqlite database initialized`, this._logSettings);
    } catch (error) {
      Logger.error(
        `<System> Unable to initialize sqlite database -- ${formatError(error)}`,
        this._logSettings,
      );
      throw new Error("Unable to initialize sqlite database.", {
        cause: error,
      });
    }
  }

  public async getAppConfig(): Promise<AppConfig> {
    if (!this._dataSource) return this._defaultAppConfig;
    const config = await this._dataSource
      .getRepository(AppConfigEntity)
      .findOne({
        where: { id: 1 },
        relations: {
          theme: true,
          profile: true,
        },
      });
    if (!config || !this._checkConfigTable(config))
      return this._defaultAppConfig;
    return config;
  }

  public async addAppProfile(name: string, path?: string): Promise<number> {
    if (!this._dataSource || !name) return 1;
    try {
      const res = await this._dataSource
        .getRepository(AppProfileEntity)
        .insert({
          name,
          path: path || this._defaultAppConfig.profile.path,
        });
      const n = Number(res.raw);
      return n > 0 || !Number.isNaN(n) ? n : 1;
    } catch (error) {
      Logger.error(
        `<System> Unable to update sqlite app_profile_entity table -- ${formatError(error)}`,
        this._logSettings,
      );
    }
    return 1;
  }

  public async getAppProfiles(): Promise<AppProfile[]> {
    if (!this._dataSource) return [this._defaultAppConfig.profile];
    const profiles = await this._dataSource
      .getRepository(AppProfileEntity)
      .find();
    if (!(profiles.length > 0)) return [this._defaultAppConfig.profile];
    return profiles;
  }

  public async getAppThemes(): Promise<AppTheme[]> {
    if (!this._dataSource) return [this._defaultAppConfig.theme];
    const themes = await this._dataSource.getRepository(AppThemeEntity).find();
    if (!(themes.length > 0)) return [this._defaultAppConfig.theme];
    return themes;
  }

  public async addAppTheme(name: string, path?: string): Promise<number> {
    if (!this._dataSource || !name) return 1;
    try {
      const res = await this._dataSource.getRepository(AppThemeEntity).insert({
        name,
        path: path || this._defaultAppConfig.theme.path,
      });
      const n = Number(res.raw);
      return n > 0 || !Number.isNaN(n) ? n : 1;
    } catch (error) {
      Logger.error(
        `<System> Unable to update sqlite app_theme_entity table -- ${formatError(error)}`,
        this._logSettings,
      );
    }
    return 1;
  }

  public async updateAppConfig(
    config: Omit<Partial<AppConfig>, "profile" | "theme">,
  ): Promise<boolean> {
    if (!this._dataSource) return false;
    try {
      await this._dataSource
        .getRepository(AppConfigEntity)
        .update({ id: 1 }, config);
      return true;
    } catch (error) {
      Logger.error(
        `<System> Unable to update sqlite app_config_entity table -- ${formatError(error)}`,
        this._logSettings,
      );
    }
    return false;
  }

  public async updateAppConfigProfile(profileId: number): Promise<boolean> {
    if (!this._dataSource) return false;
    try {
      await this._dataSource.getRepository(AppConfigEntity).update(
        { id: 1 },
        {
          profile: {
            id: profileId,
          },
        },
      );
      return true;
    } catch (error) {
      Logger.error(
        `<System> Unable to update sqlite app_config_entity table with profile -- ${formatError(error)}`,
        this._logSettings,
      );
    }
    return false;
  }

  public async updateAppConfigTheme(themeId: number): Promise<boolean> {
    if (!this._dataSource) return false;
    try {
      await this._dataSource.getRepository(AppConfigEntity).update(
        { id: 1 },
        {
          theme: {
            id: themeId,
          },
        },
      );
      return true;
    } catch (error) {
      Logger.error(
        `<System> Unable to update sqlite app_config_entity table with theme -- ${formatError(error)}`,
        this._logSettings,
      );
    }
    return false;
  }

  private _checkConfigTable(table: AppConfigEntity | null) {
    if (!table || typeof table !== "object") return false;
    const keys = Object.keys(table);
    for (const key of keys) {
      if (table[key] === undefined || table[key] === null) {
        return false;
      }
    }
    return true;
  }

  // TODO: Update file creation logic
  private async initializeTables() {
    if (!this._dataSource || !this._fileManager)
      throw new Error("No data source or file manager were defined.");
    const config = await this._dataSource
      .getRepository(AppConfigEntity)
      .findOne({
        where: { id: 1 },
        relations: {
          theme: true,
          profile: true,
        },
      });

    if (this._checkConfigTable(config)) return;

    const profile = await this._fileManager.saveFile(
      this._defaultAppConfig.profile.path,
      ProfileSchema,
      {
        name: "default",
        tiktok: {
          username: "",
        },
        tts: {
          voice: {
            category: "",
            name: "",
          },
        },
      },
    );

    if (!profile) throw new Error("Unable to save default profile file.");

    const theme = await this._fileManager.saveFile(
      this._defaultAppConfig.theme.path,
      ThemeSchema,
      {
        name: "default",
        dark: {
          backgroundColor: "#1b1b1f",
          FontColor: "#f8f8f8",
        },
        light: {
          backgroundColor: "#f8f8f8",
          FontColor: "#1b1b1f",
        },
      },
    );

    if (!theme) throw new Error("Unable to save default theme file.");

    await this._dataSource.getRepository(AppThemeEntity).insert({
      name: this._defaultAppConfig.theme.name,
      path: this._defaultAppConfig.theme.path,
    });

    await this._dataSource.getRepository(AppProfileEntity).insert({
      name: this._defaultAppConfig.profile.name,
      path: this._defaultAppConfig.profile.path,
    });

    await this._dataSource.getRepository(AppConfigEntity).insert({
      ...this._defaultAppConfig,
      theme: { id: 1 },
      profile: { id: 1 },
    });
  }
}

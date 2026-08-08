import {
  AppConfig,
  AppProfile,
  AppTheme,
  LoggerOptions,
  THEME_MODE,
} from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import { ProfileSchema, ThemeSchema } from "@/schemas";
import { JsonManagerService, PathManagerService } from "@/services";
import { join } from "path";
import { DataSource } from "typeorm";
import { LoggerService } from "../shared";
import { AppConfigEntity, AppProfileEntity, AppThemeEntity } from "./entities";

export class DBManagerService extends LoggerService {
  private _dbPath: string;
  private _jsonManagerService: JsonManagerService | null;
  private _pathManagerService: PathManagerService | null;
  private _defaultAppConfig: AppConfig;
  private _dataSource: DataSource | null;

  constructor() {
    super();
    this._dataSource = null;
    this._jsonManagerService = null;
    this._pathManagerService = null;
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  public setLogOptions(options: LoggerOptions) {
    this._logSettings = options;
  }

  public async initialize(
    dbName: string,
    jsonManagerService: JsonManagerService,
    pathManagerService: PathManagerService,
  ): Promise<void> {
    this._pathManagerService = pathManagerService;
    this._jsonManagerService = jsonManagerService;
    this._dbPath = join(
      this._pathManagerService.folders.settingsFolder,
      dbName,
    );
    try {
      this._defaultAppConfig = this._generateDefaults();
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

  private _generateDefaults() {
    if (!this._pathManagerService) {
      throw new Error("There is no path configuration defined.");
    }
    return {
      enable_server: false,
      server_port: 6767,
      session_id: "",
      use_session_id: false,
      theme_mode: THEME_MODE.SYSTEM,
      profile: {
        name: "default",
        path: join(
          this._pathManagerService.folders.profilesFolder,
          "default.json",
        ),
      },
      theme: {
        name: "default",
        path: join(
          this._pathManagerService.folders.themesFolder,
          "default.json",
        ),
      },
    };
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
    if (!this._dataSource || !this._defaultAppConfig || !name) return 1;
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
    if (!this._dataSource) return [];
    const profiles = await this._dataSource
      .getRepository(AppProfileEntity)
      .find();
    if (!(profiles.length > 0)) return [];
    return profiles;
  }

  public async getAppThemes(): Promise<AppTheme[]> {
    if (!this._dataSource) return [];
    const themes = await this._dataSource.getRepository(AppThemeEntity).find();
    if (!(themes.length > 0)) return [];
    return themes;
  }

  public async addAppTheme(name: string, path?: string): Promise<number> {
    if (!this._dataSource || !name || !this._defaultAppConfig) return 1;
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
    if (!this._dataSource || !this._jsonManagerService)
      throw new Error("No data source or json file manager were defined.");
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

    const profile = await this._jsonManagerService.saveFile(
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

    const theme = await this._jsonManagerService.saveFile(
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

import { AppConfig, LoggerOptions } from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import { DataSource } from "typeorm";
import { AppConfigEntity } from "./entities";

export class AppDataBase {
  private _dbPath: string;
  private _defaultAppConfig: AppConfig;
  private _dataSource: DataSource | null;
  private _logSettings: LoggerOptions;

  constructor(
    db_name: string,
    defaults: {
      appConfig: AppConfig;
    },
  ) {
    this._dbPath = db_name;
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
        entities: [AppConfigEntity],
        synchronize: true,
      });
      this._dataSource = await AppDataSource.initialize();
      await this.initializeConfigTable();
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
      .findOne({ where: { id: 1 } });
    if (!config || !this._checkConfigTable(config))
      return this._defaultAppConfig;
    return config;
  }

  public async updateAppConfig(config: Partial<AppConfig>): Promise<boolean> {
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

  private async initializeConfigTable() {
    if (!this._dataSource) return;

    const config = await this._dataSource
      .getRepository(AppConfigEntity)
      .findOne({ where: { id: 1 } });

    if (this._checkConfigTable(config)) return;

    this._dataSource
      .getRepository(AppConfigEntity)
      .insert(this._defaultAppConfig);
  }
}

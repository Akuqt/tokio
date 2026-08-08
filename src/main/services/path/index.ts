import { Files, Folders } from "@/common/types";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "path";

export class PathManagerService {
  public folders: Folders;
  public files: Files;

  public async initialize(
    homePath: string,
    appFolderName: string,
    callback?: (data: { files: Files; folders: Folders }) => void,
  ): Promise<void> {
    const appFolder = resolve(join(homePath, appFolderName));

    this.folders = {
      appFolder,
      settingsFolder: join(appFolder, "settings"),
      logsFolder: join(appFolder, "logs"),
      overlaysFolder: join(appFolder, "overlays"),
      profilesFolder: join(appFolder, "profiles"),
      themesFolder: join(appFolder, "themes"),
    };

    this.files = {
      logs: {
        connector: join(this.folders.logsFolder, "connector.log"),
        system: join(this.folders.logsFolder, "system.log"),
        server: join(this.folders.logsFolder, "server.log"),
        tts: join(this.folders.logsFolder, "tts.log"),
      },
    };

    const folderPaths = Object.values(this.folders);

    for (const folder of folderPaths) {
      if (!existsSync(folder)) {
        await mkdir(folder, { recursive: true });
      }
    }

    const logFiles = Object.values(this.files.logs);
    for (const file of logFiles) {
      if (!existsSync(file)) {
        await writeFile(file, "", { encoding: "utf-8" });
      }
    }

    callback?.({ files: this.files, folders: this.folders });
  }
}

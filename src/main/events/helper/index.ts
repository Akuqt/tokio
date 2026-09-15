import {
  OverlayConfig,
  OverlayConfigSchema,
  OverlayMetadata,
  OverlayMetaSchema,
} from "@/common/schemas";
import { CustomGift, OverlayConfigRedux } from "@/common/types";
import { YAMLManagerService } from "@/services/yaml";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SCRIPT_REGEX = /<script id="tokio-setup">[\s\S]*?<\/script>/i;

export function getOverlayConfig(
  data: OverlayConfig,
  mode: "value" | "default",
  gifts?: CustomGift[] | null,
): OverlayConfigRedux {
  const extracted: OverlayConfigRedux = {};

  const giftsMap = new Map<number, CustomGift>();
  if (gifts && gifts.length > 0) {
    for (const g of gifts) {
      giftsMap.set(g.value, g);
    }
  }

  for (const setting of data.fields) {
    if (setting.type === "gifts") {
      const val = setting.attributes[mode];
      if (!gifts || val == null) {
        extracted[setting.id] = [];
        continue;
      }

      const ids = Array.isArray(val) ? val : [val];

      const res = ids
        .map((id) => giftsMap.get(id))
        .filter((g): g is CustomGift => g !== undefined);

      extracted[setting.id] = setting.attributes.multiple ? res : res[0];
    } else if (setting.type === "color") {
      extracted[setting.id] = `#${setting.attributes[mode]}`;
    } else {
      extracted[setting.id] = setting.attributes[mode];
    }
  }

  return extracted;
}

export async function processOverlay(
  basedir: string,
  yaml: YAMLManagerService,
  force_external: boolean,
): Promise<{
  success: boolean;
  data?: {
    info: OverlayMetadata;
    config?: OverlayConfig;
    htmlContent: string;
  };
  paths?: {
    config: string;
    html: string;
    info: string;
  };
}> {
  try {
    const files = await readdir(basedir);

    let configPath = "";
    let infoPath = "";
    let htmlPath = "";

    for (const file of files) {
      if (file === "config.yaml" || file === "config.yml")
        configPath = join(basedir, file);
      else if (file === "info.yaml" || file === "info.yml")
        infoPath = join(basedir, file);
      else if (file === "index.html") htmlPath = join(basedir, file);
    }

    if (!infoPath || !htmlPath) {
      return { success: false };
    }

    const [info_data, htmlContent] = await Promise.all([
      yaml.loadFile(infoPath, OverlayMetaSchema),
      readFile(htmlPath, "utf-8"),
    ]);

    if (!info_data) {
      return { success: false };
    }

    let config_data: OverlayConfig | undefined = undefined;

    if (info_data.config) {
      if (!configPath) {
        return { success: false };
      }

      config_data = (await yaml.loadFile(
        configPath,
        OverlayConfigSchema,
      )) as OverlayConfig;

      if (!config_data) {
        return { success: false };
      }

      if (!htmlContent || !SCRIPT_REGEX.test(htmlContent)) {
        return { success: false };
      }
    }

    if (force_external) {
      info_data.external = true;
    }

    return {
      success: true,
      data: {
        info: info_data,
        config: config_data,
        htmlContent,
      },
      paths: {
        config: configPath,
        html: htmlPath,
        info: infoPath,
      },
    };
  } catch {
    return { success: false };
  }
}

export async function processHTML(
  id: string,
  html: string,
  dir: string,
  mode: "value" | "default",
  config?: OverlayConfig,
  gifts?: CustomGift[] | null,
): Promise<{
  success: boolean;
  parsed?: OverlayConfigRedux;
}> {
  try {
    const htmlPath = join(dir, "index.html");
    if (!config) {
      return {
        success: true,
      };
    }
    const overlay_config = getOverlayConfig(config, mode, gifts);

    const safeJson = JSON.stringify(overlay_config).replace(/</g, "\\u003c");
    const newScriptBlock = `<script id="tokio-setup"> window.__OVERLAY_CONFIG__ = ${safeJson}; window.__OVERLAY_ID__ = "${id}"; </script>`;

    const finalHtml = html.replace(SCRIPT_REGEX, newScriptBlock);

    await writeFile(htmlPath, finalHtml, "utf-8");

    return {
      success: true,
      parsed: overlay_config,
    };
  } catch {
    return {
      success: false,
    };
  }
}

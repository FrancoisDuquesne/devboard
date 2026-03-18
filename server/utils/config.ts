import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface DevBoardConfig {
  scanDirs: string[];
}

const CONFIG_PATH = resolve(process.cwd(), ".devboard-config.json");

const DEFAULT_CONFIG: DevBoardConfig = { scanDirs: [] };

export async function getConfig(): Promise<DevBoardConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      scanDirs: Array.isArray(parsed.scanDirs) ? parsed.scanDirs : [],
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: DevBoardConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

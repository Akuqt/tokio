import { glob, rm } from "node:fs/promises";

/**
 * Asynchronously removes a file or directory.
 * Ignores errors if the file doesn't exist and recursively deletes directories.
 *
 * @param {string} file - The absolute or relative path to the file or directory to remove.
 * @returns {Promise<void>} Resolves when the deletion completes or fails gracefully.
 */
export async function remove(file) {
  try {
    console.info(`Removing file: ${file}`);
    await rm(file, { force: true, recursive: true });
  } catch (error) {
    console.warn(
      `Failed to remove file: ${file} -- ${error?.message ?? "Unknown reason."}`,
    );
  }
}

/**
 * Finds and removes files or directories matching a specific glob pattern.
 * Note: Native `glob` requires Node.js v22 or newer.
 *
 * @param {string} pattern - A string that, if found in a pattern, will cause that pattern to be skipped.
 * @param {string} ignore - The glob pattern to match (e.g., '**\/*.log').
 * @returns {Promise<void>} Resolves when all matching files have been processed.
 */
export async function remove_glob(pattern, ignore) {
  for await (const file of glob(pattern)) {
    if (file.includes(ignore)) continue;
    await remove(file);
  }
}

/**
 * Processes multiple glob patterns and removes all matching files or directories.
 *
 * @param {string} ignore - A string that, if found in a pattern, will cause that pattern to be skipped.
 * @param {...string} patterns - A variable number of glob patterns to process.
 * @returns {Promise<void>} Resolves when all patterns have been completely processed.
 *
 * @example
 * // Ignores any pattern with 'src' in the string. Deletes logs and dist.
 * await bulk_removal('src', '*.log', 'dist');
 */
export async function bulk_removal(ignore, ...patterns) {
  if (patterns.length === 0) return;

  for (const pattern of patterns) {
    if (pattern.includes(ignore)) continue;

    await remove_glob(pattern, ignore);
  }
}

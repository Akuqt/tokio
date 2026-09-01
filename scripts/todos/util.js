import { createReadStream } from "node:fs";
import { glob } from "node:fs/promises";
import { createInterface } from "node:readline";

/**
 * Scans for TODOs or FIXMEs.
 *
 * @param {string} pattern - The glob pattern to search.
 */
export async function scanComments(pattern) {
  const foundTodos = [];
  const foundFixmes = [];

  for await (const file of glob(pattern)) {
    const fileStream = createReadStream(file);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;

      if (/(TODO|FIXME)/i.test(line)) {
        const match = line.match(/(TODO|FIXME):\s+(.*)/);

        if (match) {
          const type = match[1];
          const comment = match[2].trim();

          const record = { file, lineNumber, comment };

          if (type === "FIXME") {
            foundFixmes.push(record);
          } else {
            foundTodos.push(record);
          }
        }
      }
    }
  }

  console.info(
    `\n${foundTodos.length + foundFixmes.length} todo/fixme found\n`,
  );

  for (const item of foundTodos) {
    console.log(`${item.file}:${item.lineNumber} -- TODO: ${item.comment}`);
  }
  for (const item of foundFixmes) {
    console.log(`${item.file}:${item.lineNumber} -- FIXME: ${item.comment}`);
  }
}

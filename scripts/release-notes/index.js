import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { githubLogin, previousTag, readCommits, renderNotes } from "./util.js";

// Prints the release notes for a tag, or for the next release (HEAD) without one.
// Usage: node scripts/release-notes/index.js [tag]
const tag = process.argv[2];
const to = tag ?? "HEAD";
const from = previousTag(tag ? `${tag}^` : "HEAD");

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8"),
);
const repo =
  process.env.GITHUB_REPOSITORY ??
  pkg.repository.url.match(/github\.com[/:](.+?)(?:\.git)?$/)[1];
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

const commits = readCommits(from, to);

/** @type {Map<string, string | null>} */
const logins = new Map();
for (const commit of commits) {
  if (!logins.has(commit.email)) {
    logins.set(commit.email, await githubLogin(repo, commit.sha, token));
  }
}

process.stdout.write(renderNotes({ repo, from, to, commits, logins }));

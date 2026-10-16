import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const crate = join(root, "src", "installer");
const out = join(root, "installer-out");

// Optional Rust target triple, e.g. x86_64-apple-darwin. Defaults to the host.
const target = process.env.INSTALLER_TARGET;
const os = target
  ? target.includes("windows")
    ? "win32"
    : target.includes("apple")
      ? "darwin"
      : "linux"
  : process.platform;

/**
 * Runs a command in the foreground and fails the script if it fails.
 *
 * @param {string} command - The executable to run.
 * @param {string[]} args - Its arguments.
 */
function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

/**
 * Builds a macOS app bundle around the installer binary, so it opens from Finder instead of Terminal.
 *
 * @param {string} binary - Path to the compiled installer.
 * @param {string} version - The installer version.
 */
function bundleMac(binary, version) {
  const app = join(out, "Tokio Installer.app");
  const contents = join(app, "Contents");
  rmSync(app, { recursive: true, force: true });
  mkdirSync(join(contents, "MacOS"), { recursive: true });
  mkdirSync(join(contents, "Resources"), { recursive: true });

  copyFileSync(binary, join(contents, "MacOS", "tokio"));
  writeFileSync(
    join(contents, "Info.plist"),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Tokio Installer</string>
  <key>CFBundleDisplayName</key><string>Tokio Installer</string>
  <key>CFBundleIdentifier</key><string>com.ialfaro.tokio.installer</string>
  <key>CFBundleExecutable</key><string>tokio</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${version}</string>
  <key>CFBundleVersion</key><string>${version}</string>
  <key>LSMinimumSystemVersion</key><string>10.15</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
`,
  );

  // Turn the app icon into an .icns with the system tools.
  const iconset = join(
    mkdtempSync(join(tmpdir(), "tokio-icon-")),
    "icon.iconset",
  );
  mkdirSync(iconset);
  for (const size of [16, 32, 128, 256, 512]) {
    const icon = join(root, "build", "icon.png");
    run("sips", [
      "-z",
      `${size}`,
      `${size}`,
      icon,
      "--out",
      join(iconset, `icon_${size}x${size}.png`),
    ]);
    if (size <= 256) {
      const double = `${size * 2}`;
      run("sips", [
        "-z",
        double,
        double,
        icon,
        "--out",
        join(iconset, `icon_${size}x${size}@2x.png`),
      ]);
    }
  }
  run("iconutil", [
    "-c",
    "icns",
    iconset,
    "-o",
    join(contents, "Resources", "icon.icns"),
  ]);
  rmSync(resolve(iconset, ".."), { recursive: true, force: true });

  // Ad-hoc signature for the whole bundle; Apple Silicon refuses to run unsigned code.
  run("codesign", ["--force", "--deep", "--sign", "-", app]);
}

const cargoArgs = [
  "build",
  "--release",
  "--manifest-path",
  join(crate, "Cargo.toml"),
];
if (target) cargoArgs.push("--target", target);
run("cargo", cargoArgs);

const name = os === "win32" ? "tokio.exe" : "tokio";
const binary = join(
  crate,
  "target",
  ...(target ? [target] : []),
  "release",
  name,
);
const version = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(join(crate, "Cargo.toml"), "utf8"),
)[1];

mkdirSync(out, { recursive: true });

if (os === "darwin") {
  bundleMac(binary, version);
} else {
  copyFileSync(
    binary,
    join(out, os === "win32" ? "tokio.exe" : "tokio-installer"),
  );
}

console.info(`Installer written to ${out}`);

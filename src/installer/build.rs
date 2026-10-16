use std::{env, fs, path::Path};

// NOTE: WebView2 loads the page with NavigateToString, which is limited to 2 MB.
const MAX_UI_SIZE: u64 = 2 * 1024 * 1024;

const PACKAGE_JSON: &str = "../../package.json";

fn main() {
  println!("cargo:rerun-if-changed=dist/index.html");
  println!("cargo:rerun-if-changed=assets/icon.ico");
  println!("cargo:rerun-if-changed={PACKAGE_JSON}");
  println!("cargo:rerun-if-env-changed=INSTALLER_URL");

  let ui = Path::new("dist/index.html");
  let size = match fs::metadata(ui) {
    Ok(meta) => meta.len(),
    Err(_) => {
      panic!("dist/index.html is missing. Run `yarn build:installer` from the repository root.")
    }
  };
  if size > MAX_UI_SIZE {
    panic!("dist/index.html is {size} bytes, over the 2 MB WebView2 limit for inline pages.");
  }

  // INSTALLER_URL pins the download; otherwise the installer looks up the latest GitHub release.
  if let Some(url) = env::var("INSTALLER_URL").ok().filter(|url| !url.is_empty()) {
    println!("cargo:rustc-env=TOKIO_DOWNLOAD_URL={url}");
  }
  release_lookup();

  if env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
    let mut res = winresource::WindowsResource::new();
    res.set_icon("assets/icon.ico");
    res.set("ProductName", "Tokio");
    res.set("FileDescription", "Tokio Installer");
    if let Err(e) = res.compile() {
      panic!("Failed to embed the Windows resources: {e}");
    }
  }
}

/// Where the installer finds the app's build for the target system: GitHub's latest release of the
/// repository in package.json, and the asset whose name starts and ends like the `artifactName`
/// patterns in electron-builder.yml, with any version in between.
fn release_lookup() {
  let package: serde_json::Value = fs::read_to_string(PACKAGE_JSON)
    .ok()
    .and_then(|text| serde_json::from_str(&text).ok())
    .unwrap_or_else(|| panic!("Couldn't read {PACKAGE_JSON}."));

  let field = |value: &serde_json::Value| value.as_str().map(str::to_owned);
  let name = field(&package["name"]).expect("package.json has no name");
  let repository = field(&package["repository"]["url"])
    .or_else(|| field(&package["repository"]))
    .expect("package.json has no repository url");
  let repo = repository
    .trim_start_matches("git+")
    .trim_end_matches(".git")
    .trim_end_matches('/')
    .strip_prefix("https://github.com/")
    .expect("package.json's repository isn't on GitHub");

  let os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
  let arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
  let suffix = match (os.as_str(), arch.as_str()) {
    ("windows", _) => "-setup.exe",
    ("macos", "aarch64") => "-mac-arm64.zip",
    ("macos", "x86_64") => "-mac-x64.zip",
    ("linux", "x86_64") => "-x86_64.AppImage",
    _ => panic!("No Tokio build is released for {os}/{arch}."),
  };

  println!(
    "cargo:rustc-env=TOKIO_LATEST_RELEASE=https://api.github.com/repos/{repo}/releases/latest"
  );
  println!("cargo:rustc-env=TOKIO_ASSET_PREFIX={name}-");
  println!("cargo:rustc-env=TOKIO_ASSET_SUFFIX={suffix}");
}

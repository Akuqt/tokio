use std::{
  env, fs, io,
  path::{Path, PathBuf},
  process::Command,
};

pub const DOWNLOAD_NAME: &str = "tokio-mac.zip";

const APP_NAME: &str = "Tokio.app";

fn apps_dir() -> Option<PathBuf> {
  env::var_os("HOME").map(|home| PathBuf::from(home).join("Applications"))
}

pub fn app_path() -> Option<PathBuf> {
  apps_dir().map(|dir| dir.join(APP_NAME))
}

/// Extracts `Tokio.app` from the zip into `~/Applications`, replacing an older copy.
pub fn install(zip: &Path) -> Result<(), String> {
  let apps = apps_dir().ok_or("Couldn't find your home folder.")?;
  fs::create_dir_all(&apps).map_err(|e| format!("Couldn't create {}: {e}", apps.display()))?;

  // Staged next to the destination, so the final move stays on one volume.
  let staging = apps.join(".tokio-install");
  let _ = fs::remove_dir_all(&staging);

  let result = (|| {
    // ditto keeps the symlinks and permissions inside the Electron frameworks.
    let status = Command::new("ditto")
      .args(["-x", "-k"])
      .arg(zip)
      .arg(&staging)
      .status()
      .map_err(|e| format!("Couldn't extract the download: {e}"))?;
    if !status.success() {
      return Err("Couldn't extract the download.".to_string());
    }

    let app = staging.join(APP_NAME);
    if !app.is_dir() {
      return Err(format!("The download doesn't contain {APP_NAME}."));
    }

    let dest = apps.join(APP_NAME);
    if dest.exists() {
      fs::remove_dir_all(&dest).map_err(|e| format!("Couldn't replace the installed app: {e}"))?;
    }
    fs::rename(&app, &dest).map_err(|e| format!("Couldn't install the app: {e}"))
  })();

  let _ = fs::remove_dir_all(&staging);
  result
}

pub fn launch(app: &Path) -> io::Result<()> {
  Command::new("open").arg(app).spawn().map(drop)
}

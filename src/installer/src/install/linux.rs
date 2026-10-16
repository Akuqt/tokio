use std::{
  env, fs, io,
  os::unix::fs::PermissionsExt,
  path::{Path, PathBuf},
  process::{Command, Stdio},
};

pub const DOWNLOAD_NAME: &str = "tokio.AppImage";

const ICON: &[u8] = include_bytes!("../../../../build/icon.png");

/// `$XDG_DATA_HOME`, or `~/.local/share`.
fn data_dir() -> Option<PathBuf> {
  env::var_os("XDG_DATA_HOME")
    .map(PathBuf::from)
    .filter(|dir| dir.is_absolute())
    .or_else(|| env::var_os("HOME").map(|home| PathBuf::from(home).join(".local/share")))
}

pub fn app_path() -> Option<PathBuf> {
  data_dir().map(|dir| dir.join("tokio").join("Tokio.AppImage"))
}

/// Installs the AppImage into `~/.local/share/tokio` and adds a menu entry for it.
pub fn install(appimage: &Path) -> Result<(), String> {
  let data = data_dir().ok_or("Couldn't find your data folder.")?;
  let app = app_path().ok_or("Couldn't find your data folder.")?;
  let save_err = |e: io::Error| format!("Couldn't install the app: {e}");

  if let Some(dir) = app.parent() {
    fs::create_dir_all(dir).map_err(save_err)?;
  }

  // Copied next to the target and renamed, so a running copy of the app doesn't block it.
  let staged = app.with_extension("new");
  fs::copy(appimage, &staged).map_err(save_err)?;
  fs::set_permissions(&staged, fs::Permissions::from_mode(0o755)).map_err(save_err)?;
  fs::rename(&staged, &app).map_err(save_err)?;

  let icon_dir = data.join("icons/hicolor/512x512/apps");
  fs::create_dir_all(&icon_dir).map_err(save_err)?;
  fs::write(icon_dir.join("tokio.png"), ICON).map_err(save_err)?;

  let apps_dir = data.join("applications");
  fs::create_dir_all(&apps_dir).map_err(save_err)?;
  fs::write(apps_dir.join("tokio.desktop"), desktop_entry(&app)).map_err(save_err)?;

  Ok(())
}

fn desktop_entry(app: &Path) -> String {
  format!(
    "[Desktop Entry]\n\
     Type=Application\n\
     Name=Tokio\n\
     Comment=TikTok LIVE integrator\n\
     Exec={} %U\n\
     Icon=tokio\n\
     Terminal=false\n\
     Categories=AudioVideo;\n",
    quote_exec(&app.to_string_lossy())
  )
}

/// Quotes a path for a desktop entry's `Exec` key.
fn quote_exec(path: &str) -> String {
  let mut quoted = String::from("\"");
  for c in path.chars() {
    match c {
      // Escaped for the quoted argument, then the backslash itself for the string value.
      '"' | '`' | '$' => quoted.push_str(&format!("\\\\{c}")),
      '\\' => quoted.push_str("\\\\\\\\"),
      _ => quoted.push(c),
    }
  }
  quoted.push('"');
  quoted
}

pub fn launch(app: &Path) -> io::Result<()> {
  Command::new(app)
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null())
    .spawn()
    .map(drop)
}

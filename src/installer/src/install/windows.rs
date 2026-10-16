use std::{
  env, io,
  os::windows::process::CommandExt,
  path::{Path, PathBuf},
  process::Command,
};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub const DOWNLOAD_NAME: &str = "tokio-setup.exe";

fn install_dir() -> Option<PathBuf> {
  env::var_os("LOCALAPPDATA").map(|dir| PathBuf::from(dir).join("Programs").join("tokio"))
}

pub fn app_path() -> Option<PathBuf> {
  install_dir().map(|dir| dir.join("tokio.exe"))
}

/// Runs the NSIS setup silently into the per-user programs folder.
pub fn install(setup: &Path) -> Result<(), String> {
  let dir = install_dir().ok_or("Couldn't find the local app data folder.")?;

  // NSIS reads /D= raw: it must be the last argument and must not be quoted.
  let status = Command::new(setup)
    .arg("/S")
    .raw_arg(format!("/D={}", dir.display()))
    .creation_flags(CREATE_NO_WINDOW)
    .status()
    .map_err(|e| format!("Couldn't start the setup: {e}"))?;

  if !status.success() {
    return Err(match status.code() {
      Some(code) => format!("The setup failed with exit code {code}."),
      None => "The setup failed.".into(),
    });
  }
  Ok(())
}

pub fn launch(app: &Path) -> io::Result<()> {
  Command::new(app).spawn().map(drop)
}

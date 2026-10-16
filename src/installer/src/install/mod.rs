#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "linux")]
use linux as platform;
#[cfg(target_os = "macos")]
use macos as platform;
#[cfg(target_os = "windows")]
use windows as platform;

use std::{
  env, fs,
  panic::{self, AssertUnwindSafe},
};

use serde::Serialize;
use tao::event_loop::EventLoopProxy;

use crate::{
  UserEvent,
  download::{agent, download},
  release,
};

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Stage {
  Downloading,
  Installing,
  Complete,
  Error,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct StatePayload {
  pub progress: u8,
  pub state: Stage,
  pub message: String,
}

/// Downloads and installs the app, reporting each step to the UI.
pub fn run(proxy: &EventLoopProxy<UserEvent>) {
  let report = |progress: u8, state: Stage, message: String| {
    let _ = proxy.send_event(UserEvent::State(StatePayload {
      progress,
      state,
      message,
    }));
  };

  // A panic here must still reach the UI, instead of leaving it on "Downloading...".
  let result = panic::catch_unwind(AssertUnwindSafe(|| install(&report)))
    .unwrap_or_else(|_| Err("Something went wrong while installing Tokio.".into()));

  match result {
    Ok(()) => report(100, Stage::Complete, String::new()),
    Err(message) => report(0, Stage::Error, message),
  }
}

fn install(report: &dyn Fn(u8, Stage, String)) -> Result<(), String> {
  let agent = agent();
  let url = release::download_url(&agent)?;
  let file = env::temp_dir().join(platform::DOWNLOAD_NAME);

  download(&agent, &url, &file, &mut |progress| {
    report(progress, Stage::Downloading, String::new())
  })?;

  report(100, Stage::Installing, String::new());
  let result = platform::install(&file);
  let _ = fs::remove_file(&file);
  result
}

/// Starts the installed app, if it's there.
pub fn launch() {
  if let Some(app) = platform::app_path().filter(|app| app.exists()) {
    let _ = platform::launch(&app);
  }
}

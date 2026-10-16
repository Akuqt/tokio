use std::{
  fs::{self, File},
  io::{BufWriter, Read, Write},
  path::Path,
  time::Duration,
};

use ureq::{
  Agent,
  tls::{RootCerts, TlsConfig, TlsProvider},
};

/// The HTTP client, using the system's TLS and certificates.
pub fn agent() -> Agent {
  Agent::config_builder()
    .tls_config(
      TlsConfig::builder()
        .provider(TlsProvider::NativeTls)
        .root_certs(RootCerts::PlatformVerifier)
        .build(),
    )
    .timeout_connect(Some(Duration::from_secs(30)))
    .user_agent(concat!("tokio-installer/", env!("CARGO_PKG_VERSION")))
    .build()
    .into()
}

/// Downloads `url` to `dest`, calling `on_progress` with the percentage each time it changes.
/// The file is written as `<dest>.part` and renamed once complete.
pub fn download(
  agent: &Agent,
  url: &str,
  dest: &Path,
  on_progress: &mut dyn FnMut(u8),
) -> Result<(), String> {
  let response = agent
    .get(url)
    .call()
    .map_err(|e| format!("Couldn't download Tokio: {e}"))?;

  let body = response.into_body();
  let total = body.content_length();
  let mut reader = body.into_reader();

  let part = dest.with_extension("part");
  let file = File::create(&part).map_err(|e| format!("Couldn't save the download: {e}"))?;
  let mut writer = BufWriter::new(file);

  let mut buffer = vec![0u8; 64 * 1024];
  let mut read_total: u64 = 0;
  let mut last: Option<u8> = None;
  on_progress(0);

  let result = (|| -> Result<(), String> {
    loop {
      let n = reader
        .read(&mut buffer)
        .map_err(|e| format!("The download was interrupted: {e}"))?;
      if n == 0 {
        break;
      }
      writer
        .write_all(&buffer[..n])
        .map_err(|e| format!("Couldn't save the download: {e}"))?;
      read_total += n as u64;

      if let Some(total) = total.filter(|t| *t > 0) {
        let percent = (read_total.saturating_mul(100) / total).min(100) as u8;
        if last != Some(percent) {
          last = Some(percent);
          on_progress(percent);
        }
      }
    }
    writer
      .flush()
      .map_err(|e| format!("Couldn't save the download: {e}"))
  })();

  drop(writer);
  if let Err(e) = result {
    let _ = fs::remove_file(&part);
    return Err(e);
  }

  let _ = fs::remove_file(dest);
  fs::rename(&part, dest).map_err(|e| format!("Couldn't save the download: {e}"))
}

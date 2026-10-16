use serde::Deserialize;
use ureq::Agent;

/// GitHub's API for the latest published release (drafts and prereleases are skipped). Set by build.rs.
const LATEST_RELEASE: &str = env!("TOKIO_LATEST_RELEASE");
/// The asset name for this system is `<prefix><version><suffix>`. Set by build.rs.
const ASSET_PREFIX: &str = env!("TOKIO_ASSET_PREFIX");
const ASSET_SUFFIX: &str = env!("TOKIO_ASSET_SUFFIX");

#[derive(Deserialize)]
struct Release {
  tag_name: String,
  assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
  name: String,
  browser_download_url: String,
}

/// The download URL of the app's build for this system: the `INSTALLER_URL` given at build time,
/// or else the matching asset of the latest GitHub release.
pub fn download_url(agent: &Agent) -> Result<String, String> {
  if let Some(url) = option_env!("TOKIO_DOWNLOAD_URL") {
    return Ok(url.to_string());
  }

  let body = agent
    .get(LATEST_RELEASE)
    .header("Accept", "application/vnd.github+json")
    .call()
    .and_then(|mut response| response.body_mut().read_to_string())
    .map_err(|e| match e {
      ureq::Error::StatusCode(404) => "No version of Tokio has been released yet.".to_string(),
      ureq::Error::StatusCode(403 | 429) => {
        "GitHub is limiting requests right now. Try again in a few minutes.".to_string()
      }
      e => format!("Couldn't find the latest version of Tokio: {e}"),
    })?;

  let release: Release = serde_json::from_str(&body)
    .map_err(|e| format!("Couldn't read the latest version of Tokio: {e}"))?;

  // Releases are tagged v<version>, and the release also carries other files with similar names.
  let version = release.tag_name.trim_start_matches('v');
  let name = format!("{ASSET_PREFIX}{version}{ASSET_SUFFIX}");

  release
    .assets
    .into_iter()
    .find(|asset| asset.name == name)
    .map(|asset| asset.browser_download_url)
    .ok_or_else(|| "The latest version of Tokio has no download for this system yet.".into())
}

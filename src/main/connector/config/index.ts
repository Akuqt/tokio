const TIKTOK_URL = "https://www.tiktok.com";
const GIFTS_URL = "https://webcast.tiktok.com/webcast/gift/list";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export default {
  LOGIN_URL: `${TIKTOK_URL}/login`,
  TIKTOK_PARTITION: "persist:tiktok-session",
  HEADERS: {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  },
  getLiveURL: (username: string) => `${TIKTOK_URL}/@${username}/live`,
  getGiftURL: (lang: string, region: string) =>
    `${GIFTS_URL}/?aid=1988&app_language=${lang}&region=${region}&sys_region=${region}`,
};

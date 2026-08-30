export const PollingJSCode = `
(() => {
  const playerBar = document.querySelector("ytmusic-player-bar");
  if (!playerBar) return null;

  const title = playerBar.querySelector(".title")?.textContent;
  if (!title) return null;

  const bylineElements = playerBar.querySelectorAll(
    ".byline yt-formatted-string a",
  );
  const artist = Array.from(bylineElements)
    .map((el) => el.textContent)
    .join(", ");

  const albumArt = playerBar.querySelector("img")?.src;
  const playButton = playerBar.querySelector("#play-pause-button");
  const isPlaying = playButton
    ? playButton.getAttribute("aria-label") === "Pause"
    : false;

  return {
    title,
    artist: artist || "Unknown Artist",
    albumArt: albumArt || "",
    isPlaying,
  };
})();
`;

export const SearchJSCode = (query: string) => `
(() => {
  const searchIcon = document.querySelector('ytmusic-search-box tp-yt-paper-icon-button');
  if (searchIcon) searchIcon.click();

  const searchInput = document.querySelector('ytmusic-search-box input');
  if (searchInput) {
    searchInput.focus();
    searchInput.value = "${query}";
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
})();
`;

export const AfterSearchJSCode = (query: string, firtPlay: boolean) => `
(async () => {
  let firstResult = null;
  await new Promise(r => setTimeout(r, 500));
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    const searchPage = document.querySelector('ytmusic-search-page:not([hidden])');
    if (!searchPage) continue;
    firstResult = searchPage.querySelector('ytmusic-card-shelf-renderer, ytmusic-responsive-list-item-renderer');
    if (firstResult) break;
  }

  if (!firstResult) return null;

  const isFirstPlay = ${firtPlay};

  if (isFirstPlay) {
    const playBtn = firstResult.querySelector('ytmusic-play-button-renderer, .play-button-container');
    if (playBtn) {
      playBtn.click();
      await new Promise(r => setTimeout(r, 500));
      return { name: "${query}", action: "played" };
    }
    return null;
  } else {
    const menuBtn = firstResult.querySelector('ytmusic-menu-renderer #button-shape > button');
    if (!menuBtn) return null;

    menuBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    let targetBtn = document.querySelector('ytmusic-popup-container #items > ytmusic-menu-service-item-renderer:nth-child(3)');

    if (!targetBtn || (!targetBtn.textContent.toLowerCase().includes('queue') && !targetBtn.textContent.toLowerCase().includes('cola'))) {
      const allItems = document.querySelectorAll('ytmusic-popup-container #items > ytmusic-menu-service-item-renderer');
      for (const item of allItems) {
        const text = item.textContent.toLowerCase();
        if (text.includes('queue') || text.includes('cola')) {
          targetBtn = item;
          break;
        }
      }
    }

    if (targetBtn) {
      targetBtn.click();
      await new Promise(r => setTimeout(r, 500));
      return { name: "${query}", action: "queued" };
    }
    return null;
  }
})();
`;

export const LoginJSCode = `
(() => {
  const signInBtn = document.querySelector('a.sign-in-link, [aria-label="Sign in"]');
  return signInBtn === null;
})();
`;

export const ClickSelectorJSCode = (selector: string) => `
(() => {
  const btn = document.querySelector('${selector}');
  if (btn) btn.click();
})();
`;

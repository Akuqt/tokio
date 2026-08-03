function getEmojiRegex() {
  let EMOJI_REGEX: RegExp;
  try {
    EMOJI_REGEX = new RegExp(
      String.raw`(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)|(?:[#*0-9]\uFE0F?\u20E3)|(?:\p{Regional_Indicator}{2})`,
      "gu",
    );
  } catch {
    EMOJI_REGEX =
      /(?:[\u{1F300}-\u{1FAFF}](?:\uFE0F|\uFE0E)?(?:\u200D[\u{1F300}-\u{1FAFF}](?:\uFE0F|\uFE0E)?)*)|(?:[#*0-9]\uFE0F?\u20E3)|(?:[\u{1F1E6}-\u{1F1FF}]{2})/gu;
  }

  return EMOJI_REGEX;
}

export function cleanText(
  input: string | undefined | null,
  opts: { collapseWhitespace?: boolean; asciiOnly?: boolean } = {},
): string {
  const { collapseWhitespace = true, asciiOnly = false } = opts;
  if (!input) return "";

  let out = input.replace(getEmojiRegex(), "");

  try {
    out = out.normalize("NFKC");
  } catch {
    // Next
  }

  if (asciiOnly) {
    try {
      out = out.normalize("NFKD").replace(/\p{M}+/gu, "");
    } catch {
      // Next
    }
  }

  const final = collapseWhitespace ? out.replace(/\s+/g, " ").trim() : out;
  return final.toLowerCase();
}

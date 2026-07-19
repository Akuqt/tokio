import { SupportedLanguage } from "../types";

class TikTokTTSError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "TikTokTTSError";
  }
}

export function handleStatusError(statusCode: number): never {
  switch (statusCode) {
    case 1:
      throw new TikTokTTSError(
        "Authentication failed: The provided TikTok session ID is invalid or has expired. Please extract a fresh session cookie.",
        statusCode,
      );
    case 2:
      throw new TikTokTTSError(
        "Payload too large: The requested text exceeds the maximum allowed character limit for the TTS engine.",
        statusCode,
      );
    case 4:
      throw new TikTokTTSError(
        "Invalid configuration: The specified voice speaker ID is not recognized. Please verify you are using a supported voice code.",
        statusCode,
      );
    case 5:
      throw new TikTokTTSError(
        "Missing credentials: A TikTok session ID is required to use this endpoint, but none was provided.",
        statusCode,
      );
    default:
      throw new TikTokTTSError(
        `An unexpected API error occurred while processing the TTS request.`,
        statusCode,
      );
  }
}

const textReplacements: Record<
  SupportedLanguage,
  { plus: string; and: string }
> = {
  en: { plus: "plus", and: "and" },
  es: { plus: "mas", and: "y" },
};

export function prepareText(
  text: string,
  lang: SupportedLanguage = "en",
): string {
  const dictionary = textReplacements[lang];
  return text
    .replace(/\+/g, dictionary.plus)
    .replace(/&/g, dictionary.and)
    .replace(/\s/g, "+");
}

export * from "./voices";

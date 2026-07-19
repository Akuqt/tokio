import axios, { isAxiosError } from "axios";
import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { handleStatusError, prepareText, VoicesData } from "../common";
import config from "../config";
import {
  SupportedLanguage,
  TTSResponse,
  TTSResponseALT,
  VoiceName,
} from "../types";

export class TTSService {
  private static sessionId: string | undefined;

  private static getURL(
    text: string,
    speaker: string,
    lang: SupportedLanguage,
  ) {
    const preparedText = prepareText(text, lang);
    return `${config.API_URL}/?text_speaker=${speaker}&req_text=${preparedText}&speaker_map_type=0&aid=1233`;
  }

  private static async generateB64TTSALT(
    text: string,
    voice: string,
  ): Promise<string> {
    try {
      const response = await axios.post<TTSResponseALT>(
        config.API_URL_ALT,
        {
          text,
          voice,
        },
        {
          headers: config.HEADERS,
        },
      );
      if (!response.data.success) {
        throw new Error(`TTS generation failed: ${response.data.error}`);
      }
      return response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        throw new Error(`TTS generation failed: ${errorData.error}`, {
          cause: error,
        });
      }
      throw error;
    }
  }

  private static async generateB64TTS(
    text: string,
    lang: SupportedLanguage,
    voice: string,
  ): Promise<string> {
    try {
      const requestUrl = this.getURL(text, voice, lang);
      const response = await axios.post<TTSResponse>(requestUrl, null, {
        headers: {
          ...config.HEADERS,
          Cookie: `sessionid=${this.sessionId}`,
        },
      });
      const statusCode = response.data?.status_code;
      if (statusCode !== undefined && statusCode !== 0) {
        handleStatusError(statusCode);
      }
      return response.data.data.v_str;
    } catch (error) {
      if (isAxiosError(error) && error.response?.data) {
        const statusCode = error.response.data.status_code;
        if (statusCode !== undefined && statusCode !== 0) {
          handleStatusError(statusCode);
        }
      }
      throw error;
    }
  }

  private static getB64TTS<T extends SupportedLanguage>(
    text: string,
    lang: T,
    voice: VoiceName[T],
  ): Promise<string> {
    const speaker = VoicesData[voice] ?? config.DEFAULT_VOICE;
    if (!this.sessionId) {
      return this.generateB64TTSALT(text, speaker);
    } else {
      return this.generateB64TTS(text, lang, speaker);
    }
  }

  /**
   * Sets the TikTok session ID.
   * This is required to access the primary, high-quality TTS endpoints.
   *
   * @param session - The `sessionid` cookie string extracted from a valid TikTok web session.
   */
  public static setSessionId(session: string) {
    this.sessionId = session;
  }

  /**
   * Generates TTS audio and writes the binary buffer directly to the specified file path.
   *
   * @param path - The destination file path including the extension (e.g., "./output.mp3").
   * @param text - The text to be converted into speech.
   * @param lang - The target language code (e.g., "en", "es").
   * @param voice - The specific voice model to use, strictly typed to the selected language.
   * @returns A promise that resolves when the file has been successfully written to disk.
   */
  public static async saveToFile<T extends SupportedLanguage>(
    path: string,
    text: string,
    lang: T,
    voice: VoiceName[T],
  ): Promise<void> {
    const base64Audio = await this.getB64TTS(text, lang, voice);
    const audioBuffer = Buffer.from(base64Audio, "base64");
    try {
      await writeFile(path, audioBuffer);
    } catch (error: unknown) {
      throw new Error(`Failed to save audio to file: ${path}`, {
        cause: error,
      });
    }
  }

  /**
   * Generates TTS audio and returns it as a Node.js Readable stream.
   * This is ideal for streaming the audio directly to an HTTP response, WebSocket, or Discord bot without writing to disk.
   *
   * @param text - The text to be converted into speech.
   * @param lang - The target language code (e.g., "en", "es").
   * @param voice - The specific voice model to use, strictly typed to the selected language.
   * @returns A promise that resolves to a standard Node.js Readable stream containing the decoded binary data.
   */
  public static async generateStream<T extends SupportedLanguage>(
    text: string,
    lang: T,
    voice: VoiceName[T],
  ): Promise<Readable> {
    const base64Audio = await this.getB64TTS(text, lang, voice);
    const audioBuffer = Buffer.from(base64Audio, "base64");
    return Readable.from(audioBuffer);
  }
}

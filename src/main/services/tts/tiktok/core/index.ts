import { LoggerOptions } from "@/common/types";
import axios, { isAxiosError } from "axios";
import { Buffer } from "node:buffer";
import { GenerationResponse, TTSService, VoiceData } from "../../../shared";
import { handleStatusError, prepareText, Voices, VoicesData } from "../common";
import config from "../config";
import { TTSResponse, TTSResponseALT } from "../types";

export class TikTokTTS extends TTSService {
  private sessionId: string | undefined;

  constructor() {
    super();
    this._logSettings = {
      file: false,
      path: "",
    };
  }

  private getURL(text: string, speaker: string, lang: string) {
    const preparedText = prepareText(text, lang);
    return `${config.API_URL}/?text_speaker=${speaker}&req_text=${preparedText}&speaker_map_type=0&aid=1233`;
  }

  public setLogOptions(options: LoggerOptions): void {
    this._logSettings = options;
  }

  private async generateB64TTSALT(
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

  private async generateB64TTS(
    text: string,
    lang: string,
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

  public setKey(session: string) {
    this.sessionId = session;
  }

  public getB64TTS(text: string, lang: string, voice: string): Promise<string> {
    const speaker = VoicesData[voice] ?? config.DEFAULT_VOICE;
    if (!this.sessionId) {
      return this.generateB64TTSALT(text, speaker);
    } else {
      return this.generateB64TTS(text, lang, speaker);
    }
  }

  public async generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse> {
    try {
      const base64Audio = await this.getB64TTS(
        text,
        lang || "en",
        voice || config.DEFAULT_VOICE,
      );
      const audioBuffer = Buffer.from(base64Audio, "base64");
      return { buffer: audioBuffer, success: true };
    } catch {
      // Next
    }
    return { success: false };
  }

  public getVoices(): VoiceData {
    return Voices;
  }
}

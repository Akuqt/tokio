export type SapiRequest =
  | { type: "voices" }
  | {
      type: "speak";
      text: string;
      voice?: string;
      rate: number;
      volume: number;
    };

export type SapiResponse = {
  id: number;
  ok: boolean;
  data?: unknown;
  error?: string;
};

export type SapiResponseMap = {
  voices: SapiVoice[];
  speak: string;
};

export type SapiVoice = {
  name: string;
  lang: string;
  gender: string;
  age: string;
  vendor: string;
  default: boolean;
};

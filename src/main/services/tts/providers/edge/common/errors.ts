import { EdgeStage, TokenVersion } from "../types";

export type EdgeAuth = {
  tokenVersion: TokenVersion;
  gecVersion: string;
};

type EdgeTTSErrorDetails = {
  auth?: EdgeAuth;
  status?: number;
  serverDate?: string;
  cause?: unknown;
};

// Every failure names its stage so a user log is enough to tell what broke, see README.md.
export class EdgeTTSError extends Error {
  public readonly stage: EdgeStage;
  public readonly status?: number;
  public readonly serverDate?: string;
  public readonly auth?: EdgeAuth;

  constructor(
    stage: EdgeStage,
    message: string,
    details?: EdgeTTSErrorDetails,
  ) {
    const status = details?.status ? ` HTTP ${details.status}` : "";
    const auth = details?.auth
      ? ` (token v${details.auth.tokenVersion}, Sec-MS-GEC-Version ${details.auth.gecVersion})`
      : "";
    super(`Edge <${stage}>${status} ${message}${auth}`, {
      cause: details?.cause,
    });
    this.name = "EdgeTTSError";
    this.stage = stage;
    this.status = details?.status;
    this.serverDate = details?.serverDate;
    this.auth = details?.auth;
  }
}

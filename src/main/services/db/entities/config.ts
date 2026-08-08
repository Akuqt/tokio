import { THEME_MODE } from "@/common/types";
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ConnectorProviderEntity } from "./connector";
import { AppProfileEntity } from "./profile";
import { AppThemeEntity } from "./theme";
import { TTSProviderEntity } from "./tts";

@Entity()
export class AppConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("boolean")
  enable_server: boolean;

  @Column("int")
  server_port: number;

  @Column("text")
  theme_mode: THEME_MODE;

  @OneToOne(() => AppThemeEntity)
  @JoinColumn({ name: "themeId" })
  theme: AppThemeEntity;

  @OneToOne(() => AppProfileEntity)
  @JoinColumn({ name: "profileId" })
  profile: AppProfileEntity;

  @OneToOne(() => ConnectorProviderEntity)
  @JoinColumn({ name: "connector_providerId" })
  connector_provider: ConnectorProviderEntity;

  @OneToOne(() => TTSProviderEntity)
  @JoinColumn({ name: "tts_providerId" })
  tts_provider: TTSProviderEntity;
}

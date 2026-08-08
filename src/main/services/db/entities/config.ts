import { THEME_MODE } from "@/common/types";
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AppProfileEntity } from "./profile";
import { AppThemeEntity } from "./theme";

@Entity()
export class AppConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("boolean")
  enable_server: boolean;

  @Column("int")
  server_port: number;

  @Column("boolean")
  use_session_id: boolean;

  @Column("text")
  session_id: string;

  @Column("text")
  theme_mode: THEME_MODE;

  @OneToOne(() => AppThemeEntity)
  @JoinColumn({ name: "themeId" })
  theme: AppThemeEntity;

  @OneToOne(() => AppProfileEntity)
  @JoinColumn({ name: "profileId" })
  profile: AppProfileEntity;
}

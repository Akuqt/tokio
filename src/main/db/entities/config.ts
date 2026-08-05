import { THEME_MODE } from "@/common/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AppConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("boolean")
  log2file: boolean;

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

  @Column("text")
  theme_name: string;

  @Column("text")
  profile: string;
}

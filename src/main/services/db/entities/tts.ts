import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TTSProviderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text", { unique: true })
  name: string;

  @Column("text")
  key: string;
}

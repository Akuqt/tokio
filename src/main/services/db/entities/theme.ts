import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AppThemeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  file: string;

  @Column("text")
  name: string;

  @Column("text")
  path: string;
}

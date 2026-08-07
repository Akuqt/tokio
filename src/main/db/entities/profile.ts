import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AppProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  name: string;

  @Column("text")
  path: string;
}

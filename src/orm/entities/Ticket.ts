import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    nullable: true,
  })
  title: string;
  @Column({
    nullable: true,
  })
  description: string;
  @Column({
    nullable: true,
  })
  type: string;
  @Column({
    nullable: true,
  })
  venue: string;
  @Column({
    nullable: true,
  })
  status: string;
  @Column({
    nullable: true,
  })
  price: number;
  @Column({
    nullable: true,
  })
  priority: string;
  @Column({
    nullable: true,
  })
  due_date: Date;
  @Column({
    nullable: true,
  })
  created_by: number;
  @Column({
    type: 'int',
    array: true,
    nullable: true,
  })
  assigneduser: number[];
}

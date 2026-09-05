import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany
} from 'typeorm';

import { Event } from './event.entity';

@Entity({ name: 'event_categories' })
class Category {
  @PrimaryGeneratedColumn('uuid')
  category_id!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Event, (event) => event.category)
  events!: Event[];
}

export { Category };

import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Event } from './event.entity';
import { User } from './user.entity';

@Entity({ name: 'organizer_profiles' })
class Organizer {
  @PrimaryColumn('uuid')
  user_id!: string;

  @OneToOne(() => User, (user) => user.organizerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'text', nullable: true })
  organization?: string;

  @OneToMany(() => Event, (event) => event.organizer)
  events!: Event[];

}

export { Organizer };

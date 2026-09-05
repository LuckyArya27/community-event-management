import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';

import { User } from './user.entity';
import { EventRegistration } from './event-registration.entity';
import { EventReview } from './event-review.entity';

@Entity({ name: 'participant_profiles' })
class Participant {
  @PrimaryColumn('uuid')
  user_id!: string;

  @OneToOne(() => User, (user) => user.participantProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ nullable: true })
  institution?: string;

  @OneToMany(() => EventRegistration, (registration) => registration.participant)
  registrations!: EventRegistration[];

  @OneToMany(() => EventReview, (review) => review.participant)
  reviews!: EventReview[];
}

export { Participant };

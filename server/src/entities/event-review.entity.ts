import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Event } from './event.entity';
import { Participant } from './participant.entity';

@Entity({ name: 'event_reviews' })
class EventReview {
  @PrimaryGeneratedColumn('uuid')
  event_review_id!: string;

  @ManyToOne(() => Event, (event) => event.reviews)
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @ManyToOne(() => Participant, (participant) => participant.reviews)
  @JoinColumn({ name: 'participant_id' })
  participant!: Participant;

  @Column()
  rating!: number;

  @Column({ nullable: true })
  comment!: string;

  @CreateDateColumn()
  created_at!: Date;
}

export { EventReview };

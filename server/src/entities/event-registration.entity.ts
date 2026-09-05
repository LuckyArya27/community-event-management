import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  CreateDateColumn
} from 'typeorm';

import { Participant } from './participant.entity';
import { Event } from './event.entity';

@Entity({ name: 'event_registrations' })
class EventRegistration {
  @PrimaryGeneratedColumn('uuid')
  event_registration_id!: string;

  @ManyToOne(() => Participant, (participant) => participant.registrations, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'participant_id' })
  participant!: Participant;

  @ManyToOne(() => Event, (event) => event.registrations, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @Column({
    type: 'enum',
    enum: ['registered', 'cancelled', 'attended', 'no-show'],
    default: 'registered'
  })
  status!: 'registered' | 'cancelled' | 'attended' | 'no-show';

  @CreateDateColumn()
  registered_at!: Date;
}

export { EventRegistration };

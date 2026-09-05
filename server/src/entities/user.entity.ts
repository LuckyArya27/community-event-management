import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  OneToOne,
  UpdateDateColumn
} from 'typeorm';

import { Organizer } from './organizer.entity';
import { Participant } from './participant.entity';

@Entity({ name: 'user' })
class User {
  @PrimaryGeneratedColumn('uuid')
  user_id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  password_hash!: string;

  @Column({ enum: ['organizer', 'participant', 'admin'] })
  role!: string;

  @OneToOne(() => Organizer, (profile) => profile.user)
  organizerProfile?: Organizer;

  @OneToOne(() => Participant, (profile) => profile.user)
  participantProfile?: Participant;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date | null;
}

export { User };

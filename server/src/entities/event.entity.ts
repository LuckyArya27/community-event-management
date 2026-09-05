import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany
} from 'typeorm';

import { Organizer } from './organizer.entity';
import { Category } from './event-category.entity';
import { EventRegistration } from './event-registration.entity';
import { EventReview } from './event-review.entity';

@Entity({ name: 'events' })
class Event {
  @PrimaryGeneratedColumn('uuid')
  event_id!: string;

  @Column()
  title!: string;
  
  @Column({ nullable: true, type: 'text' })
  description!: string;
  
  @Column()
  capacity!: number;

  @Column({ nullable: true, type: 'text' })
  location!: string;

  @Column({
    type: 'enum',
    enum: ['open', 'closed', 'cancelled', 'full', 'completed'],
    default: 'open'
  })
  status!: 'open' | 'closed' | 'cancelled' | 'full' | 'completed';
  
  @Column({ type: 'timestamp' })
  event_date!: Date;
  
  @ManyToOne(() => Organizer, { nullable: false })
  @JoinColumn({ name: 'organizer_id' })
  organizer!: Organizer;

  @Column({ default: false })
  organizer_deleted!: boolean;
  
  @ManyToOne(() => Category, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations!: EventRegistration[];

  // @Column({ default: 0 })
  // registration_count!: number;

  @OneToMany(() => EventReview, (review) => review.event)
  reviews!: EventReview[];
  
    @CreateDateColumn()
    created_at!: Date;
  
    @UpdateDateColumn()
    updated_at!: Date;
}

export { Event };

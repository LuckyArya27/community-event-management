import { AppDataSource } from '../config/data-source';
import { EventRegistration } from '../entities/event-registration.entity';

const registrationRepository = AppDataSource.getRepository(EventRegistration);

async function findByEventAndParticipant(event_id: string, participant_id: string): Promise<EventRegistration | null> {
  return await registrationRepository.findOne({
    where: {
      event: { event_id },
      participant: { user_id: participant_id }
    }
  });
}

async function cancelRegisteredByEvent(event_id: string): Promise<void> {
  await registrationRepository
    .createQueryBuilder()
    .update(EventRegistration)
    .set({ status: 'cancelled' })
    .where('event_id = :event_id', { event_id })
    .andWhere('status = :status', { status: 'registered' })
    .execute();
}

async function findByEventAndParticipantAndStatus(event_id: string, participant_id: string, status: EventRegistration['status']): Promise<EventRegistration | null> {
  return await registrationRepository.findOne({
    where: {
      event: { event_id },
      participant: { user_id: participant_id },
      status
    }
  });
}

async function countByEventAndStatus(event_id: string, status: EventRegistration['status']): Promise<number> {
  return await registrationRepository.count({
    where: {
      event: { event_id },
      status
    }
  });
}

async function countRegisteredByEventIds(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const rows = await registrationRepository
    .createQueryBuilder('registration')
    .select('registration.event_id', 'event_id')
    .addSelect('COUNT(*)', 'count')
    .where('registration.event_id IN (:...eventIds)', { eventIds })
    .andWhere('registration.status = :status', { status: 'registered' })
    .groupBy('registration.event_id')
    .getRawMany();

  return rows.reduce((acc, row) => {
    acc[row.event_id] = parseInt(row.count, 10);
    return acc;
  }, {} as Record<string, number>);
}

async function createRegistration(event_id: string, participant_id: string): Promise<EventRegistration> {
  const registration = registrationRepository.create({
    event: { event_id },
    participant: { user_id: participant_id }
  });
  return await registrationRepository.save(registration);
}

async function findMany(where: any) {
  return await registrationRepository
    .createQueryBuilder('registration')
    .leftJoinAndSelect('registration.event', 'event')
    .leftJoinAndSelect('event.category', 'category')
    .leftJoinAndSelect('registration.participant', 'participant')
    .leftJoinAndSelect('participant.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where(where)
    .getMany();
}

async function findByEvent(event_id: string): Promise<EventRegistration[]> {
  return await registrationRepository
    .createQueryBuilder('registration')
    .leftJoin('registration.event', 'event')
    .leftJoinAndSelect('registration.participant', 'participant')
    .leftJoinAndSelect('participant.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('event.event_id = :event_id', { event_id })
    .getMany();
}

async function findById(event_registration_id: string): Promise<EventRegistration | null> {
  return await registrationRepository
    .createQueryBuilder('registration')
    .leftJoinAndSelect('registration.event', 'event')
    .leftJoinAndSelect('event.organizer', 'organizer')
    .leftJoinAndSelect('registration.participant', 'participant')
    .leftJoin('participant.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('registration.event_registration_id = :event_registration_id', { event_registration_id })
    .getOne();
}

async function saveRegistration(registration: EventRegistration): Promise<EventRegistration> {
  return await registrationRepository.save(registration);
}

export {
  findByEventAndParticipant,
  findByEventAndParticipantAndStatus,
  countByEventAndStatus,
  countRegisteredByEventIds,
  cancelRegisteredByEvent,
  createRegistration,
  findMany,
  findByEvent,
  findById,
  saveRegistration
};

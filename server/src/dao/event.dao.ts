import { SelectQueryBuilder } from 'typeorm';

import { AppDataSource } from '../config/data-source';
import { Event } from '../entities/event.entity';
import { InternalServerError } from '../error-handling/internal-server';

const eventRepository = AppDataSource.getRepository(Event);

function createEventSearchQueryBuilder(): SelectQueryBuilder<Event> {
  return eventRepository
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.category', 'category')
    .leftJoinAndSelect('event.organizer', 'organizer')
    .leftJoin('organizer.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role']);
}

async function eventSearch(qb: SelectQueryBuilder<Event>, page: number, limit: number) {
  const [data, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

    return { data, total, page, limit };
}

async function findEventById(event_id: string) {
  return await eventRepository
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.category', 'category')
    .leftJoinAndSelect('event.organizer', 'organizer')
    .leftJoin('organizer.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('event.event_id = :event_id', { event_id })
    .getOne();
}

async function getEventByOrganizer(organizer_id: string) {
  return await eventRepository
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.category', 'category')
    .leftJoinAndSelect('event.organizer', 'organizer')
    .leftJoin('organizer.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('event.organizer.user_id = :organizer_id', { organizer_id })
    .getMany();
}

async function findEventsOfDeletedOrganizer() {
  return await eventRepository
    .createQueryBuilder('event')
    .leftJoinAndSelect('event.category', 'category')
    .leftJoinAndSelect('event.organizer', 'organizer')
    .leftJoin('organizer.user', 'user')
    .addSelect(['user.name', 'user.email', 'user.role'])
    .where('event.organizer_deleted = :deleted', { deleted: true })
    .getMany();
}

async function createEvent(data: Partial<Event>, organizer_id: string, category_id: string) {
  const event = eventRepository.create({
    ...data,
    organizer: { user_id: organizer_id },
    category: { category_id }
  });
  return await eventRepository.save(event);
}

async function updateEvent(event: Event, updatedFields: Partial<Event>) {
  eventRepository.merge(event, updatedFields);
  return await eventRepository.save(event);
}

async function saveEvent(event: Event) {
  return await eventRepository.save(event);
}

async function updateEventStatusAtStartUp() {
  try {
    const getAllEvents = await eventRepository.find();
    const currentDate = new Date();
    for (const event of getAllEvents) {
      if (event.status === 'open' && event.event_date === currentDate) {
        event.status = 'closed';
      } else if (event.status === 'open' && event.event_date < currentDate) {
        event.status = 'completed';
      }
      await eventRepository.save(event);
    }
  } catch (error) {
    throw new InternalServerError('Failed to update event statuses', 'EventStatusUpdateFailedException');
  }
};

async function cancelEvent(organizer_id: string) {
  return await eventRepository
    .createQueryBuilder()
    .update(Event)
    .set({ status: 'cancelled' })
    .where('organizer_id = :organizer_id', { organizer_id })
    .andWhere('status NOT IN (:...terminal)', { terminal: ['cancelled', 'completed'] })
    .execute();
}

async function reassignOrganizer(fromOrganizerId: string, toOrganizerId: string) {
  return await eventRepository
    .createQueryBuilder()
    .update(Event)
    .set({ organizer: { user_id: toOrganizerId }, organizer_deleted: true })
    .where('organizer_id = :fromOrganizerId', { fromOrganizerId })
    .execute();
}

async function deleteEvent(event: Event) {
  await eventRepository.remove(event);
  return true;
}

export {
  createEventSearchQueryBuilder,
  eventSearch,
  findEventById,
  getEventByOrganizer,
  findEventsOfDeletedOrganizer,
  createEvent,
  updateEvent,
  saveEvent,
  updateEventStatusAtStartUp,
  cancelEvent,
  reassignOrganizer,
  deleteEvent
};
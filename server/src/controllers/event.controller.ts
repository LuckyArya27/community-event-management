import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { redisClient, clearRedisCache } from "../config/redis-config";
import { assertRole, assertOwnerOrRole } from "../middlewares/auth.middleware";
import * as eventDAO from "../dao/event.dao";
import * as categoryDAO from "../dao/event-category.dao";
import * as registrationDAO from "../dao/event-registration.dao";
import { InternalServerError, NotFoundError, BadRequestError } from "../error-handling";

function toPublicEvent(event: any) {
  if (!event.organizer_deleted) return event;
  return { ...event, organizer: null };
}

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  open: ['closed', 'cancelled'],
  full: ['closed', 'cancelled'],
  closed: ['cancelled', 'completed'],
  completed: [],
  cancelled: []
};

function assertEventManager(user: any, event: any) {
  if (event.organizer_deleted) {
    assertRole(user, 'admin');
  } else {
    assertOwnerOrRole(user, event.organizer.user_id);
  }
}

type EventStatus = 'open' | 'full' | 'closed' | 'completed' | 'cancelled';

const SORTABLE_FIELDS = ['event_date', 'title', 'capacity', 'created_at', 'status'];
const DEFAULT_SORT = 'event_date';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const searchEvents = async (req: Request, res: Response) => {
  try {
    // console.log('Search events request received with query:', req.query); // Debugging line
    const query = req.query as Record<string, string>;
    const cacheKey = `search_events:${JSON.stringify(query)}`;
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log('Returning cached search result'); // Debugging line
      return res.status(StatusCodes.OK).json(JSON.parse(cachedResult));
    }
    const { keyword, category, categoryId, dateFrom, dateTo, availability, excludeCancelled } = query;

    const sort = SORTABLE_FIELDS.includes(query.sort) ? query.sort : DEFAULT_SORT;
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));

    const qb = eventDAO.createEventSearchQueryBuilder();
    if (keyword?.trim()) {
      qb.andWhere('(event.title ILIKE :kw OR event.description ILIKE :kw)', { kw: `%${keyword.trim()}%` });
    }
    if (category?.trim()) {
      qb.andWhere('category.name ILIKE :category', { category: category.trim() });
    }
    if (categoryId?.trim()) {
      qb.andWhere('category.category_id = :categoryId', { categoryId: categoryId.trim() });
    }
    if (dateFrom && dateTo) {
      qb.andWhere('event.event_date BETWEEN :from AND :to', {
        from: `${dateFrom}T00:00:00.000`,
        to: `${dateTo}T23:59:59.999`
      });
    } else if (dateFrom) {
      qb.andWhere('event.event_date >= :from', { from: `${dateFrom}T00:00:00.000` });
    } else if (dateTo) {
      qb.andWhere('event.event_date <= :to', { to: `${dateTo}T23:59:59.999` });
    }
    if (availability === 'open') {
      qb.andWhere('event.status = :status', { status: 'open' });
    }
    if (excludeCancelled === 'true') {
      qb.andWhere('event.status != :cancelled', { cancelled: 'cancelled' });
    }
    qb.orderBy(`event.${sort}`, 'ASC');

    const result = await eventDAO.eventSearch(qb, page, limit);
    // console.log('Search result:', result); // Debugging line
    const events = result.data;
    const eventIds = events.map((e) => e.event_id);
    const countsByEventId = await registrationDAO.countRegisteredByEventIds(eventIds);
    const eventsWithCounts = events.map((event) => ({
      ...event,
      registered_count: countsByEventId[event.event_id] || 0,
    }));
    result.data = eventsWithCounts;
    const responseData = { ...result, data: result.data.map(toPublicEvent) };
    await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData)); // Cache for 2 mins
    return res.status(StatusCodes.OK).json(responseData);
  } catch (error) {
    console.error('Failed to search events:', error);
    throw new InternalServerError('Failed to search events', 'FailedEventSearchException');
  }
};


const getEventByOrganizer = async (req: Request, res: Response) => {
  try {
    const organizerId = req.user!.user_id;
    assertRole(req.user, 'organizer');
    const qb = eventDAO.createEventSearchQueryBuilder();
    qb.where('organizer.user_id = :organizerId', { organizerId });
    const events = await qb.getMany();
    const eventIds = events.map((e) => e.event_id);
    const countsByEventId = await registrationDAO.countRegisteredByEventIds(eventIds);
    const eventsWithCounts = events.map((event) => ({
      ...event,
      registered_count: countsByEventId[event.event_id] || 0,
    }));
    return res.status(StatusCodes.OK).json(eventsWithCounts.map(toPublicEvent));
  } catch (error) {
    throw new InternalServerError('Failed to get events by organizer', 'FailedEventGetByOrganizerException');
  }
}

const getEventsOfDeletedOrganizer = async (req: Request, res: Response) => {
  try {
    assertRole(req.user, 'admin');
    // console.log('Entered getEventsOfDeletedOrganizer'); // Debugging line
    const deletedOrganizerEvents = await eventDAO.findEventsOfDeletedOrganizer();

    return res.status(StatusCodes.OK).json(deletedOrganizerEvents);
  } catch (error) {
    throw new InternalServerError('Failed to get events of deleted organizer', 'FailedEventGetOfDeletedOrganizerException');
  }
};

const getEventById = async (req: Request, res: Response) => {
  try {
    // console.log('Entered getEventById'); // Debugging line
    const event = await eventDAO.findEventById(req.params.id as string);
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }

    if (!event.organizer_deleted) {
      const registeredCount = await registrationDAO.countByEventAndStatus(event.event_id, 'registered');
      const eventWithCount = { ...event, registered_count: registeredCount };
      return res.json(toPublicEvent(eventWithCount));
    } else {
      return res.json(toPublicEvent(event));
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to get event by ID', 'FailedEventGetByIdException');
  }
};

const createEvent = async (req: Request, res: Response) => {
  try {
    assertRole(req.user, 'organizer');
    const requiredFields = ['title', 'description', 'eventDate', 'capacity', 'location', 'category'];

    const { title, description, eventDate, capacity, location, category } = req.body;
    if (!title || !eventDate || !capacity || !category) {
      const missingFields = requiredFields.filter((field) => !req.body[field]);
      throw new BadRequestError(`Missing ${missingFields.join(', ')} fields`, 'MissingRequiredFieldsException');
    }

    const categoryEntity = await categoryDAO.getCategoryByName(category);

    if (!categoryEntity) {
      throw new BadRequestError('Invalid category', 'InvalidCategoryException');
    }
    
    const eventData = {
      title,
      description,
      event_date: new Date(eventDate),
      capacity: Number(capacity),
      location,
    };
    
    const newEvent = await eventDAO.createEvent(
      eventData,
      req.user!.user_id,
      categoryEntity.category_id
    );
    await clearRedisCache('search_events:*');

    return res.status(StatusCodes.CREATED).json(newEvent);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to create event', 'EventCreationFailedException');
  }
};

const updateEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id as string;
  try {
    const event = await eventDAO.findEventById( eventId );
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    assertEventManager(req.user, event)

    const { status, organizer, ...editableFields } = req.body;
    if (editableFields.category) {
      const categoryEntity = await categoryDAO.getCategoryByName(editableFields.category);
      if (!categoryEntity) {
        throw new BadRequestError('Invalid category', 'InvalidCategoryException');
      }
      editableFields.category_id = categoryEntity.category_id;
    }
    const updatedEvent = await eventDAO.updateEvent(event, editableFields);
    await clearRedisCache('search_events:*');
    
    return res.status(StatusCodes.OK).json(updatedEvent);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to update event', 'EventUpdateFailedException');
  }
};

const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const event = await eventDAO.findEventById( eventId );
    if(!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    assertEventManager(req.user, event)

    const nextStatus: EventStatus = req.body.status;
    if (!ALLOWED_TRANSITIONS[event.status].includes(nextStatus)) {
      throw new BadRequestError(`Invalid status transition from ${event.status} to ${nextStatus}`, 'InvalidStatusTransitionException');
    }

    event.status = nextStatus;
    const updatedEventStatus = await eventDAO.saveEvent(event);
    if (nextStatus === 'cancelled') {
      await registrationDAO.cancelRegisteredByEvent(event.event_id);
    }
    await clearRedisCache('search_events:*');
    
    return res.status(StatusCodes.OK).json(updatedEventStatus);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to update event status', 'EventStatusUpdateFailedException');
  }
};

const deleteEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const event = await eventDAO.findEventById( eventId );
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    assertEventManager(req.user, event)

    await eventDAO.deleteEvent(event);
    await clearRedisCache('search_events:*');

    return res.status(StatusCodes.NO_CONTENT).send();
  }
  catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to delete event', 'EventDeletionFailedException');
  }
};

const getEventParticipants = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const event = await eventDAO.findEventById( eventId );
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    assertEventManager(req.user, event);

    const registrations = await registrationDAO.findByEvent( eventId );
    return res.status(StatusCodes.OK).json(registrations);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to fetch event participants', 'FetchEventParticipantsFailedException');
  }
};

const markAttendance = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;
    const event = await eventDAO.findEventById( eventId );
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    if (event.status !== 'closed') {
      throw new BadRequestError(
        'Attendance can only be marked for closed events',
        'InvalidEventStatusForAttendanceException'
      );
    }
    assertEventManager(req.user, event);

    const registrationId = req.params.registrationId as string;
    const registration = await registrationDAO.findById( registrationId );
    if (!registration || registration.event.event_id !== eventId) {
      throw new NotFoundError('Registration not found for this event', 'RegistrationNotFoundException');
    }
    if (registration.status !== 'registered') {
      throw new BadRequestError('This registration is already in a final state', 'RegistrationAlreadyFinalException');
    }

    registration.status = req.body.attended ? 'attended' : 'no-show';
    const updatedRegistration = await registrationDAO.saveRegistration(registration);
    return res.status(StatusCodes.OK).json(updatedRegistration);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to mark attendance', 'MarkAttendanceFailedException');
  }
};

export {
  searchEvents,
  getEventById,
  getEventByOrganizer,
  getEventsOfDeletedOrganizer,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEventParticipants,
  markAttendance
};
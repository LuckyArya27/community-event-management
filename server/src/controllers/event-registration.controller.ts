import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import * as registrationDAO from "../dao/event-registration.dao";
import * as eventDAO from "../dao/event.dao";
import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError
} from "../error-handling";
import { assertOwnerOrRole, assertRole } from "../middlewares/auth.middleware";

const createEventRegistration = async (req: Request, res: Response) => {
  try {
    assertRole(req.user, 'participant');

    const event = await eventDAO.findEventById(req.body.eventId as string);
    if (!event) {
      throw new NotFoundError('Event not found', 'EventNotFoundException');
    }
    if (event.status !== 'open') {
      throw new BadRequestError('Event is not open for registration', 'EventNotOpenException');
    }

    const [registered, attended, noShow] = await Promise.all([
      registrationDAO.findByEventAndParticipantAndStatus(event.event_id, req.user!.user_id, 'registered'),
      registrationDAO.findByEventAndParticipantAndStatus(event.event_id, req.user!.user_id, 'attended'),
      registrationDAO.findByEventAndParticipantAndStatus(event.event_id, req.user!.user_id, 'no-show')
    ]);
    if (registered || attended || noShow) {
      throw new BadRequestError(
        attended || noShow
          ? 'You have already completed this event registration'
          : 'You are already registered for this event',
        'AlreadyRegisteredException'
      );
    }

    const registration = await registrationDAO.createRegistration(event.event_id, req.user!.user_id);

    const count = await registrationDAO.countByEventAndStatus(event.event_id, 'registered');
    if (count >= event.capacity) {
      event.status = 'full';
      await eventDAO.saveEvent(event);
    }

    return res.status(StatusCodes.CREATED).json({ message: 'Registration successful', registration });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to register for event', 'EventRegistrationFailedException');
  }
};

const getRegistrations = async(req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    // console.log('Get registrations request received with query:', req.query); // Debugging line
    const where: any = {};
    if (req.user!.role === 'participant') {
      where.participant = { user_id: req.user!.user_id };
    } else if (eventId) {
      where.event = { event_id: eventId };
    }
    // console.log('Where clause for fetching registrations:', where); // Debugging line

    let registrations = await registrationDAO.findMany(where);
    if (req.user!.role === 'participant') {
      const latestByEvent = new Map<string, (typeof registrations)[number]>();

      for (const registration of registrations) {
        const eventId = registration.event.event_id;
        const latest = latestByEvent.get(eventId);
        if (!latest || registration.registered_at > latest.registered_at) {
          latestByEvent.set(eventId, registration);
        }
      }

      registrations = Array.from(latestByEvent.values());
    }

    // console.log('Fetched registrations:', registrations); // Debugging line
    return res.status(StatusCodes.OK).json(registrations);
  } catch (error) {
    throw new InternalServerError('Failed to fetch registrations', 'FetchRegistrationsFailedException');
  }
};

const getRegistrationById = async (req: Request, res: Response) => {
  try {
    const registration = await registrationDAO.findById(req.params.id as string);
    // console.log('Fetched registration:', registration); // Debugging line
    if (!registration) {
      throw new NotFoundError('Registration not found', 'RegistrationNotFoundException');
    }
    // console.log('Fetched registration after null check'); // Debugging line
    const isOwner = registration.participant.user_id === req.user!.user_id;
    // console.log('Is owner:', isOwner); // Debugging line
    const isEventOrganizer = registration.event.organizer.user_id === req.user!.user_id;
    // console.log('Is event organizer:', isEventOrganizer); // Debugging line
    if (!isOwner && !isEventOrganizer && req.user!.role !== 'admin') {
      throw new UnauthorizedError('Unauthorized access', 'UnauthorizedAccessException');
    }
    // console.log('User is authorized to view registration'); // Debugging line
    return res.status(StatusCodes.OK).json(registration);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to fetch registration', 'FetchRegistrationFailedException');
  }
};

const cancelRegistration = async (req: Request, res: Response) => {
  try {
    const registration = await registrationDAO.findById(req.params.id as string);
    if (!registration) {
      throw new NotFoundError('Registration not found', 'RegistrationNotFoundException');
    }

    assertOwnerOrRole(req.user, registration.participant.user_id, 'admin');

    if (registration.status !== 'registered') {
      throw new BadRequestError('This registration is already in a final state', 'RegistrationAlreadyFinalException');
    }

    registration.status = 'cancelled';
    await registrationDAO.saveRegistration(registration);

    const event = registration.event;
    if (event.status === 'full') {
      event.status = 'open';
      await eventDAO.saveEvent(event);
    }

    return res.status(StatusCodes.OK).json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to cancel registration', 'CancelRegistrationFailedException');
  }
};

export {
  createEventRegistration,
  getRegistrations,
  getRegistrationById,
  cancelRegistration
};
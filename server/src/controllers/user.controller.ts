import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { redisClient, clearRedisCache } from '../config/redis-config';

import * as UserDAO from '../dao/user.dao';
import * as EventDAO from '../dao/event.dao';
import {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError
} from '../error-handling';
import { hashPassword } from '../utils/encryption';
import { User, Participant, Organizer } from '../utils/interfaces';
import { assertRole, assertOwnerOrRole } from '../middlewares/auth.middleware';


const getUsersUsingQuery = async (req: Request, res: Response): Promise<Response> => {
  try {
    assertRole(req.user, 'admin');
    // console.log('User authenticated as admin:', req.user); // Debugging line
    const queryParams = req.query;
    const cachedUsers = await redisClient.get(`users:${JSON.stringify(queryParams)}`);
    if (cachedUsers) {
      console.log('Returning cached users'); // Debugging line
      return res.status(StatusCodes.OK).json(JSON.parse(cachedUsers));
    }

    const queryBuilder = UserDAO.createQueryBuilderForUser();

    queryBuilder.select([
      'user.user_id',
      'user.email',
      'user.name',
      'user.role',
      'user.created_at',
      'user.deleted_at'
    ]);

    if (queryParams.role === 'organizer') {
      queryBuilder.addSelect(['organizer.organization']);
    } else if (queryParams.role === 'participant') {
      queryBuilder.addSelect(['participant.institution']);
    } else {
      queryBuilder.addSelect([
        'organizer.organization',
        'participant.institution'
      ]);
    }

    if (queryParams.role) {
      queryBuilder.andWhere('user.role = :role', {
        role: queryParams.role
      });
    }

    if (queryParams.created_before && queryParams.created_after) {
      queryBuilder.andWhere('user.created_at BETWEEN :start AND :end', {
        start: new Date(queryParams.created_after as string),
        end: new Date(`${queryParams.created_before}T23:59:59.999`)
      });
    } else if (queryParams.created_before) {
      queryBuilder.andWhere('user.created_at <= :end', {
        end: new Date(`${queryParams.created_before}T23:59:59.999`)
      });
    } else if (queryParams.created_after) {
      queryBuilder.andWhere('user.created_at >= :start', {
        start: new Date(queryParams.created_after as string)
      });
    }

    const users = await UserDAO.findUsersUsingQuery(queryBuilder);
    users.forEach(user => {
      if (user.role !== 'organizer') {
        delete user.organizerProfile;
      } 
      if (user.role !== 'participant') {
        delete user.participantProfile;
      }
    });

    await redisClient.setEx(`users:${JSON.stringify(queryParams)}`, 120, JSON.stringify(users));
    return res.status(StatusCodes.OK).json(users);
  } catch (error) {
    throw new InternalServerError('Failed to fetch users', 'UserFetchException');
  }
};

const getOneUserDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.params.id as string | undefined || req.user?.user_id;
    assertOwnerOrRole(req.user, userId as string, 'admin');

    const user_id: string | undefined = (req.params.id) as string | undefined || req.user?.user_id;
    // console.log('Fetching details for user ID:', user_id); // Debugging line
    if (!user_id) {
      throw new NotFoundError('User ID not provided', 'UserIdNotProvidedException');
    }
    const user: User | null = await UserDAO.findUserDetailsById(user_id);
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to fetch user details', 'UserFetchException');
  }
};

const updateUserDetails = async (req: Request, res: Response): Promise<Response> => {
  const user_id: string | undefined = (req.params.id) as string | undefined;
  assertOwnerOrRole(req.user, user_id as string);
  try {
    if (!req.user) {
      throw new UnauthorizedError('Unauthorized access', 'UnauthorizedAccessException');
    }

    const allowedFields = ['name', 'email', 'password'];
    if (!user_id) {
      throw new NotFoundError('User ID not provided', 'UserIdNotProvidedException');
    }
    const updatedFields = req.body;
    if (!Object.keys(updatedFields).every(field => allowedFields.includes(field))) {
      throw new BadRequestError('Invalid fields in request body', 'InvalidFieldsException');
    }
    const emptyFields: string[] = [];
    for (const field of Object.keys(updatedFields)) {
      if (typeof updatedFields[field] !== 'string' || updatedFields[field].trim() === '') {
        emptyFields.push(field);
      }
    }
    if (emptyFields.length > 0) {
      let errorMsg = '';
      for (let i = 0; i < emptyFields.length-1; i++) {
        errorMsg = errorMsg.concat(emptyFields[i]+', ');
      }
      errorMsg = errorMsg.concat(emptyFields[emptyFields.length-1]);
      throw new BadRequestError(`Empty or non-string values provided for fields: ${errorMsg}`, 'InvalidValuesException');
    }

    if (updatedFields.password) {
      updatedFields.password_hash = await hashPassword(updatedFields.password);
      delete updatedFields.password;
    }

    const user: any = await UserDAO.findUserById(user_id, { select: true });
    if (!user) {
      throw new NotFoundError(`User with ID ${user_id} not found`, 'UserNotFoundException');
    }
    const updatedUser: User = await UserDAO.updateUser(user, updatedFields);
    if (user.role === 'participant') {
      const updatedParticipant: Partial<Participant> = await UserDAO.updateParticipant(user.user_id, updatedFields);
      return res.status(StatusCodes.OK).json(updatedParticipant);
    } else if (user.role === 'organizer') {
      const updatedOrganizer: Partial<Organizer> = await UserDAO.updateOrganizer(user.user_id, updatedFields);
      return res.status(StatusCodes.OK).json(updatedOrganizer);
    }

    await clearRedisCache('users:*');
    
    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError(`Failed to update user with ID ${user_id}`, 'UpdateUserFailedException');
  }
};

const softDeleteUser = async (req: Request, res: Response): Promise<Response> => {
  const user_id: string | undefined = (req.params.id) as string | undefined;
  try {
    assertRole(req.user, 'admin');
    if (req.user?.user_id === user_id) {
      throw new ForbiddenError('You cannot ban yourself', 'ForbiddenException');
    }
    if (!user_id) {
      throw new NotFoundError('User ID not provided', 'UserIdNotProvidedException');
    }
    const user: User | null = await UserDAO.findUserById(user_id, { select: true });
    if (!user) {
      throw new NotFoundError(`User with ID ${user_id} not found`, 'UserNotFoundException');
    }
    if (user.role === 'admin') {
      throw new ForbiddenError('Admin cannot be banned', 'ForbiddenException');
    }
    if (user.role === 'organizer') {
      const events = await EventDAO.getEventByOrganizer(user_id);
      events.forEach(async (event) => {
        event.organizer_deleted = true;
        await EventDAO.saveEvent(event);
      });
      await EventDAO.cancelEvent(user_id);
    }
    await UserDAO.softDeleteUser(user_id);
    await clearRedisCache('users:*');

    return res.status(StatusCodes.OK).json({ message: `User with ID ${user_id} banned` });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError(`Failed to ban user with ID ${user_id}`, 'BanUserFailedException');
  }
};

const unBanUser = async (req: Request, res: Response): Promise<Response> => {
  assertRole(req.user, 'admin');
  const user_id: string | undefined = (req.params.id) as string | undefined;
  try {
    if (!user_id) {
      throw new NotFoundError('User ID not provided', 'UserIdNotProvidedException');
    }
    const user: User | null = await UserDAO.findUserById(user_id, { select: true, withDeleted: true });
    if (!user) {
      throw new NotFoundError(`User with ID ${user_id} not found`, 'UserNotFoundException');
    }
    
    if (user.role === 'organizer') {
      const events = await EventDAO.getEventByOrganizer(user_id);
      events.forEach(async (event) => {
        event.organizer_deleted = false;
        await EventDAO.saveEvent(event);
      });
    }
    await UserDAO.unBanUser(user_id);
    await clearRedisCache('users:*');

    return res.status(StatusCodes.OK).json({ message: `User with ID ${user_id} unbanned` });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError(`Failed to unban user with ID ${user_id}`, 'UnbanUserFailedException');
  }
}

const hardDeleteUser = async (req: Request, res: Response): Promise<Response> => {
  const user_id: string | undefined = (req.params.id) as string | undefined;
  try {
    assertOwnerOrRole(req.user, user_id as string);

  if (!user_id) {
    throw new NotFoundError('User ID not provided', 'UserIdNotProvidedException');
  }
  const user: User | null = await UserDAO.findUserById(user_id, { select: true });
  if (!user) {
    throw new NotFoundError(`User with ID ${user_id} not found`, 'UserNotFoundException');
  }
  if (user.role === 'admin') {
      throw new ForbiddenError('Admin cannot be deleted', 'ForbiddenException');
  }
  if (user.role === 'organizer') {
    await EventDAO.cancelEvent(user_id);
    const placeholderOrganizer = await UserDAO.findOrCreatePlaceholderOrganizer();
    await EventDAO.reassignOrganizer(user_id, placeholderOrganizer.user_id);
  }
    await UserDAO.hardDeleteUser(user_id);
    await clearRedisCache('users:*');

    return res.status(StatusCodes.NO_CONTENT).json();
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError(`Failed to permanently delete user with ID ${user_id}`, 'PermanentDeleteUserFailedException');
  }
};

export {
  getUsersUsingQuery,
  getOneUserDetails,
  updateUserDetails,
  softDeleteUser,
  unBanUser,
  hardDeleteUser
};

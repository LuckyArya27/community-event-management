import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as UserDAO from '../dao/user.dao';
import { BadRequestError, NotFoundError, InternalServerError } from '../error-handling';
import * as encryption from '../utils/encryption';
import { loginUser, NewUser } from '../utils/interfaces';
import { generateJWTToken } from '../utils/token';

const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body as loginUser;
    // console.log('Login request received:', { email, password }); // Debug
    if (!email || !password) {
      throw new BadRequestError('Email and password are required', 'MissingCredentialsException');
    }
    const user = await UserDAO.findUserByEmail(email.toLowerCase());
    if (!user) {
      throw new NotFoundError('User not found', 'UserNotFoundException');
    }

    const passwordMatch = await encryption.comparePasswords(password, user.password_hash);
    if (!passwordMatch) {
      throw new BadRequestError('Invalid password', 'InvalidPasswordException');
    }
    const token = generateJWTToken(
      user.user_id,
      user.name,
      user.role
    );
    
    return res.status(StatusCodes.OK).json({ token });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
    throw error;
    }
    throw new InternalServerError('Failed to login user', 'LoginFailedException');
  }
};

const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userData = req.body as NewUser;
    if (!userData.email || !userData.password || !userData.name || !userData.role) {
      throw new BadRequestError('Missing required fields', 'MissingRequiredFieldsException');
    }
    const existingUser = await UserDAO.findUserByEmail(userData.email.toLowerCase());
    if (existingUser) {
      throw new BadRequestError('Email already in use', 'EmailAlreadyInUseException');
    }
    if (!['participant', 'organizer', 'admin'].includes(userData.role)) {
      throw new BadRequestError('Invalid role', 'InvalidRoleException');
    }

    const newUser = await UserDAO.createUser({
      email: userData.email.toLowerCase(),
      name: userData.name,
      password_hash: await encryption.hashPassword(userData.password),
      role: userData.role
    });

    if (userData.role === 'participant') {
      await UserDAO.createParticipant(newUser.user_id, { institution: req.body.institution || null });
    } else if (userData.role === 'organizer') {
      await UserDAO.createOrganizer(newUser.user_id, { organization: req.body.organization || null });
    }

    const token = generateJWTToken(
      newUser.user_id,
      newUser.name,
      newUser.role
    );
    return res.status(StatusCodes.CREATED).json({ message: 'User created successfully', token });
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to create user', 'UserCreationFailedException');
  }
};

const createAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new BadRequestError('Invalid role for admin', 'InvalidRoleException');
    }
    const name = req.body.name;
    const queryBuilder: any = {
      role: 'admin',
      select: {'email': true, 'name': true, 'role': true, 'created_at': true}
    };
    const adminNumber: number = (await UserDAO.findUsersUsingQuery(queryBuilder)).length + 1;
    const adminName: string = name || 'Admin';
    const adminData = {
      email: `admin-${adminNumber}@example.com`,
      name: adminName,
      password_hash: await encryption.hashPassword(
        process.env.DEFAULT_ADMIN_PASSWORD + adminName.toLowerCase() + adminNumber.toString()
      ),
      role: 'admin'
    };
    const newUser = await UserDAO.createUser(adminData);
    return res.status(StatusCodes.CREATED).json(newUser);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new InternalServerError('Failed to create admin', 'CreateAdminFailedException');
  }
};

export {
  login,
  createUser,
  createAdmin
};
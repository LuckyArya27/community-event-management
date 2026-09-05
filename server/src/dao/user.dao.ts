import { User } from '../entities/user.entity';
import { Organizer } from '../entities/organizer.entity';
import { Participant } from '../entities/participant.entity';
import { AppDataSource } from '../config/data-source';
import { InternalServerError } from '../error-handling'
import { hashPassword } from '../utils/encryption';
import { SelectQueryBuilder } from 'typeorm';

const userRepository = AppDataSource.getRepository(User);
const organizerRepository = AppDataSource.getRepository(Organizer);
const participantRepository = AppDataSource.getRepository(Participant);

function createQueryBuilderForUser() {
  return userRepository.createQueryBuilder('user')
    .withDeleted()
    .leftJoinAndSelect('user.organizerProfile', 'organizer')
    .leftJoinAndSelect('user.participantProfile', 'participant');
}

async function findUsersUsingQuery(query: any): Promise<Partial<User>[]> {
  if (query instanceof SelectQueryBuilder) {
    return await query.getMany();
  }

  return await userRepository.find({ ...query });
}

async function findUserById(user_id: string, query: any): Promise<User | null> {
  return await userRepository.findOne({ where: { user_id }, ...query });
}

async function findUserDetailsById(user_id: string): Promise<User | null> {
  return await userRepository
    .createQueryBuilder('user')
    .withDeleted()
    .leftJoinAndSelect('user.organizerProfile', 'organizer')
    .leftJoinAndSelect('user.participantProfile', 'participant')
    .select([
      'user.user_id',
      'user.email',
      'user.name',
      'user.role',
      'user.created_at',
      'organizer.user_id',
      'organizer.organization',
      'participant.user_id',
      'participant.institution'
    ])
    .where('user.user_id = :user_id', { user_id })
    .getOne();
}

async function findUserByEmail(email: string): Promise<User | null> {
  return await userRepository.findOne({ where: { email } });
}

async function findAdmin(): Promise<User[] | null> {
  return await userRepository.find({ where: { role: 'admin' } });
}

async function createUser(user: Partial<User>): Promise<User> {
  const newUser: User = userRepository.create(user);
  return await userRepository.save(newUser);
}

async function createParticipant(user_id: string, data: { institution?: string }): Promise<Participant> {
  const newParticipant: Participant = participantRepository.create({ user_id, ...data });
  return await participantRepository.save(newParticipant);
}

async function createOrganizer(user_id: string, data: { organization?: string }): Promise<Organizer> {
  const newOrganizer: Organizer = organizerRepository.create({ user_id, ...data });
  return await organizerRepository.save(newOrganizer);
}

async function updateUser(user: User, updatedFields: Partial<User>): Promise<User> {
  userRepository.merge(user, updatedFields);
  return await userRepository.save(user);
}

async function updateParticipant(user_id: string, updatedFields: Partial<Participant>): Promise<Participant> {
  const participant = await participantRepository.findOne({ where: { user_id } });
  if (!participant) {
    throw new Error(`Participant with user_id ${user_id} not found`);
  }
  participantRepository.merge(participant, updatedFields);
  return await participantRepository.save(participant);
}

async function updateOrganizer(user_id: string, updatedFields: Partial<Organizer>): Promise<Organizer> {
  const organizer = await organizerRepository.findOne({ where: { user_id } });
  if (!organizer) {
    throw new Error(`Organizer with user_id ${user_id} not found`);
  }
  organizerRepository.merge(organizer, updatedFields);
  return await organizerRepository.save(organizer);
}

async function softDeleteUser(user_id: string): Promise<boolean> {
  const deletedUser = await userRepository.softDelete(user_id);
  return deletedUser.affected! > 0;
}

async function unBanUser(user_id: string): Promise<boolean> {
  const restoredUser = await userRepository.restore(user_id);
  return restoredUser.affected! > 0;
}

async function hardDeleteUser(user_id: string): Promise<boolean> {
  const deletedUser = await userRepository.delete(user_id);
  return deletedUser.affected! > 0;
}

async function findOrCreateFirstAdmin(): Promise<void> {
  const adminUsers = await findAdmin();
  if (!adminUsers || adminUsers.length === 0) {
    const firstAdmin: Partial<User> = {
      email: process.env.ADMIN_EMAIL!,
      name: process.env.ADMIN_NAME!,
      password_hash: await hashPassword(process.env.DEFAULT_ADMIN_PASSWORD),
      role: 'admin',
    };
    try {
      await createUser(firstAdmin);
    } catch (error) {
      throw new InternalServerError('Failed to create first admin user', 'CreateFirstAdminFailedException');
    }
  }
}

async function findOrCreatePlaceholderOrganizer(): Promise<Organizer> {
  const placeholderOrganizerEmail = 'system-organizer@internal.local';
  let placeholderOrganizer: Organizer | null = await organizerRepository.findOne({
    where: { user: { email: placeholderOrganizerEmail } }
  });
  if (!placeholderOrganizer) {
    const newOrganizer = organizerRepository.create({
      user: {
        email: placeholderOrganizerEmail,
        name: 'System Organizer',
        password_hash: '',
        role: 'organizer'
      },
      organization: 'Placeholder Organization'
    });
    try {
      placeholderOrganizer = await organizerRepository.save(newOrganizer);
    } catch {
      throw new InternalServerError('Failed to create Placeholder Organizer', 'CreatePlaceholderOrganizerFailedException');
    }
  }
  return placeholderOrganizer;
}

export {
  createQueryBuilderForUser,
  findUsersUsingQuery,
  findUserById,
  findUserDetailsById,
  findUserByEmail,
  findAdmin,
  createUser,
  createParticipant,
  createOrganizer,
  updateUser,
  updateParticipant,
  updateOrganizer,
  softDeleteUser,
  unBanUser,
  hardDeleteUser,
  findOrCreateFirstAdmin,
  findOrCreatePlaceholderOrganizer
};

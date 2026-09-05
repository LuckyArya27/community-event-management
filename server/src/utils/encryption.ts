import bcrypt from 'bcrypt';

import { InternalServerError } from '../error-handling';

async function hashPassword(password: string | undefined): Promise<string> {
  const saltRounds = 12;
  try {
    if (!password) {
      throw new InternalServerError('Password is required', 'PasswordRequiredException');
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new InternalServerError('Failed to hash password', 'HashPasswordFailedException');
  }
}

async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    return passwordMatch;
  } catch (error) {
    throw new InternalServerError('Failed to compare passwords', 'ComparePasswordsFailedException');
  }
}

export { hashPassword, comparePasswords };
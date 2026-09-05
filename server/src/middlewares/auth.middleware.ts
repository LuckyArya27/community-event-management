import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../error-handling';
import { UserData } from '../utils/interfaces';


const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenHeader: string | undefined = req.headers.authorization;
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid Authentication', 'InvalidAuthenticationException');
    }

    const token = tokenHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret) as Request['user'];
    // console.log('Decoded JWT payload:', payload); // Debugging line
    req.user = payload;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token', 'InvalidTokenException');
  }
};

const assertRole = (user: UserData | undefined, role: 'participant' | 'organizer' | 'admin') => {
  if (!user || user.role !== role) {
    throw new ForbiddenError('Forbidden access', 'ForbiddenAccessException');
  }
};

const assertOwnerOrRole = (user: UserData | undefined, ownerId: string | null, ...allowedRoles: UserData['role'][]) => {
  // console.log('Asserting owner or role:', { user, ownerId, allowedRoles }); // Debugging line
  if (!user) {
    throw new UnauthorizedError('Unauthorized access', 'UnauthorizedAccessException');
  }
  if (allowedRoles.includes(user.role)) {
    return true;
  }
  if (ownerId && user.user_id === ownerId) {
    return true;
  }
  throw new ForbiddenError('Forbidden access: Not the owner', 'ForbiddenAccessException');
};

export { auth, assertRole, assertOwnerOrRole };

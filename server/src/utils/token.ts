import jwt from 'jsonwebtoken';

function generateJWTToken(user_id: string, name: string, role: string): string {
  const token = jwt.sign({
    user_id,
    name,
    role
  },
    process.env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: process.env.JWT_EXPIRATION as jwt.SignOptions['expiresIn']
    });
  return token;
}

export { generateJWTToken };
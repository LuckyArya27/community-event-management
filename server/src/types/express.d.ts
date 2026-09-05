declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        name: string;
        role: 'participant' | 'organizer' | 'admin';
      };
    }
  }
}

export {};
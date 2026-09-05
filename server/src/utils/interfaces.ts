interface loginUser {
  email?: string;
  password?: string;
}

interface UserData {
  user_id: string;
  name: string;
  role: 'participant' | 'organizer' | 'admin';
}

interface NewUser extends UserData {
  email: string;
  password: string;
}

interface StoredUser extends UserData {
  password_hash: string;
}

interface User {
  user_id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  created_at: Date;
  deleted_at: Date | null;
}

interface Participant extends User {
  institution?: string | null;
}

interface Organizer extends User {
  organization?: string | null;
}

interface EventSearchFilters {
  keyword?: string;
  category?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  availability?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export {
  loginUser,
  UserData,
  NewUser,
  StoredUser,
  User,
  Participant,
  Organizer,
  EventSearchFilters
};
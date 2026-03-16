export interface UserDoc {
  _id?: any;
  email: string | null;
  passwordHash?: string | null;
  provider: 'email' | 'google';
  providerId?: string | null;
  createdAt: number;
  resetTokenHash?: string | null;
  resetTokenExpires?: number | null;
}

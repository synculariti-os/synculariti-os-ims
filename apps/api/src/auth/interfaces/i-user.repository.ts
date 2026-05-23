import type { SafeUser, UserId } from '@ims/types';

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string | null;
}

export interface IUserRepository {
  findById(userId: UserId): Promise<SafeUser | null>;
  findByEmail(email: string): Promise<SafeUser | null>;
  updateLastLogin(userId: UserId): Promise<void>;
  updateProfile(userId: UserId, data: UpdateProfileInput): Promise<SafeUser>;
}

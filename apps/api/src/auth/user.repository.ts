import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, SafeUser, UserId, asUserId } from '@ims/types';
import { IUserRepository, UpdateProfileInput } from './interfaces/i-user.repository';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async findById(userId: UserId): Promise<SafeUser | null> {
    const user = await this.db
      .selectFrom('users')
      .select([
        'id',
        'email',
        'full_name as fullName',
        'phone_number as phoneNumber',
        'active',
        'created_at as createdAt',
        'updated_at as updatedAt',
        'last_login_at as lastLoginAt'
      ])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) return null;
    
    return {
      ...user,
      id: asUserId(user.id)
    };
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.db
      .selectFrom('users')
      .select([
        'id',
        'email',
        'full_name as fullName',
        'phone_number as phoneNumber',
        'active',
        'created_at as createdAt',
        'updated_at as updatedAt',
        'last_login_at as lastLoginAt'
      ])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) return null;
    
    return {
      ...user,
      id: asUserId(user.id)
    };
  }

  async updateLastLogin(userId: UserId): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ last_login_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async updateProfile(userId: UserId, data: UpdateProfileInput): Promise<SafeUser> {
    const updated = await this.db
      .updateTable('users')
      .set({
        full_name: data.fullName,
        phone_number: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', userId)
      .returning([
        'id',
        'email',
        'full_name as fullName',
        'phone_number as phoneNumber',
        'active',
        'created_at as createdAt',
        'updated_at as updatedAt',
        'last_login_at as lastLoginAt'
      ])
      .executeTakeFirst();

    if (!updated) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      ...updated,
      id: asUserId(updated.id)
    };
  }
}

import { aspnetusers, aspnetuserroles, aspnetroles } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface AdminUserListFilters {
  search?: string;
  orphansOnly?: boolean;
  limit: number;
  offset: number;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  contactCount: number;
  accessFailedCount: number;
  lockoutEndDateUtc: Date | null;
  hasPassword: boolean;
}

export interface AdminUserListResult {
  users: AdminUserListItem[];
  total: number;
}

export interface IUserRepository extends IBaseRepository<aspnetusers> {
  findByUsername(username: string): Promise<aspnetusers | null>;
  findByUserId(userId: string): Promise<aspnetusers | null>;
  findWithRoles(
    userId: string,
  ): Promise<
    (aspnetusers & { aspnetuserroles: (aspnetuserroles & { aspnetroles: aspnetroles })[] }) | null
  >;
  updatePassword(userId: string, hashedPassword: string): Promise<aspnetusers>;
  updateUser(userId: string, data: Partial<aspnetusers>): Promise<aspnetusers>;
  deleteByUserId(userId: string): Promise<void>;
  countContactsForUser(userId: string): Promise<number>;
  countAccountsOwnedByUser(userId: string): Promise<number>;
  searchAdminUsers(filters: AdminUserListFilters): Promise<AdminUserListResult>;
}

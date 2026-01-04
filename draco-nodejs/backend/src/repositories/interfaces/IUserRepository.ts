import { aspnetusers, aspnetuserroles, aspnetroles } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

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
}

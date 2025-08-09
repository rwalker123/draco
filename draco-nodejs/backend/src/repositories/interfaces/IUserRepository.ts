import { aspnetusers, aspnetuserroles, aspnetroles } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IUserRepository extends IBaseRepository<aspnetusers> {
  findByEmail(email: string): Promise<aspnetusers | null>;
  findByUsername(username: string): Promise<aspnetusers | null>;
  findWithRoles(
    userId: string,
  ): Promise<
    (aspnetusers & { aspnetuserroles: (aspnetuserroles & { aspnetroles: aspnetroles })[] }) | null
  >;
  updatePassword(userId: string, hashedPassword: string): Promise<aspnetusers>;
}

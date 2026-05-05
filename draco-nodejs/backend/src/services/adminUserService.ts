import { Prisma } from '#prisma/client';
import { ConflictError, NotFoundError } from '../utils/customErrors.js';
import { IUserRepository, RepositoryFactory } from '../repositories/index.js';
import {
  AdminUserListQueryType,
  AdminUserListResponseType,
  AdminUserSummaryType,
} from '@draco/shared-schemas';

export class AdminUserService {
  private readonly userRepository: IUserRepository;

  constructor() {
    this.userRepository = RepositoryFactory.getUserRepository();
  }

  /**
   * List aspnetusers rows for the global Administrator login-management page.
   * Supports username substring search and an "orphans only" filter for rows
   * with zero linked contacts.
   */
  async listUsers(query: AdminUserListQueryType): Promise<AdminUserListResponseType> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;

    const { users, total } = await this.userRepository.searchAdminUsers({
      search: query.search,
      orphansOnly: query.orphansOnly,
      limit,
      offset,
    });

    const summaries: AdminUserSummaryType[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      contactCount: user.contactCount,
      accessFailedCount: user.accessFailedCount,
      lockoutEndDateUtc: user.lockoutEndDateUtc ? user.lockoutEndDateUtc.toISOString() : null,
      hasPassword: user.hasPassword,
    }));

    const hasNext = offset + summaries.length < total;
    const hasPrev = offset > 0;

    return {
      users: summaries,
      total,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Delete an aspnetusers row. Refuses with 409 if any contact still references
   * this user via contacts.userid (cleanup is reserved for orphan rows).
   */
  async deleteUser(userId: string): Promise<void> {
    const existing = await this.userRepository.findByUserId(userId);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const contactCount = await this.userRepository.countContactsForUser(userId);
    if (contactCount > 0) {
      throw new ConflictError(
        'This auth user is still linked to one or more contacts. Unlink them before deleting.',
      );
    }

    const ownedAccountCount = await this.userRepository.countAccountsOwnedByUser(userId);
    if (ownedAccountCount > 0) {
      throw new ConflictError(
        'This auth user is the owner of one or more accounts. Reassign ownership before deleting.',
      );
    }

    try {
      await this.userRepository.deleteByUserId(userId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictError(
          'This auth user is still referenced by other records (for example emails or templates) and cannot be deleted.',
        );
      }
      throw err;
    }
  }
}

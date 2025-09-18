import {
  IUserRepository,
  ITeamRepository,
  IAccountRepository,
  IContactRepository,
} from './interfaces/index.js';
import {
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaAccountRepository,
  PrismaContactRepository,
} from './implementations/index.js';

import prisma from '../lib/prisma.js';

/**
 * Factory functions to create repository instances
 * This provides a clean way to access repositories without direct Prisma dependencies
 */
export class RepositoryFactory {
  private static userRepository: IUserRepository;
  private static teamRepository: ITeamRepository;
  private static accountRepository: IAccountRepository;
  private static contactRepository: IContactRepository;

  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository(prisma);
    }
    return this.userRepository;
  }

  static getTeamRepository(): ITeamRepository {
    if (!this.teamRepository) {
      this.teamRepository = new PrismaTeamRepository(prisma);
    }
    return this.teamRepository;
  }

  static getAccountRepository(): IAccountRepository {
    if (!this.accountRepository) {
      this.accountRepository = new PrismaAccountRepository(prisma);
    }
    return this.accountRepository;
  }

  static getContactRepository(): IContactRepository {
    if (!this.contactRepository) {
      this.contactRepository = new PrismaContactRepository(prisma);
    }
    return this.contactRepository;
  }
}

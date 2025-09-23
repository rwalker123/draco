import {
  IUserRepository,
  ITeamRepository,
  IAccountRepository,
  IContactRepository,
  IRoleRepository,
  ISeasonRepository,
  ILeagueRepository,
  ICleanupRepository,
  ISponsorRepository,
} from './interfaces/index.js';
import {
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaAccountRepository,
  PrismaContactRepository,
  PrismaRoleRepository,
  PrismaSeasonRepository,
  PrismaLeagueRepository,
  PrismaCleanupRepository,
  PrismaSponsorRepository,
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
  private static roleRepository: IRoleRepository;
  private static seasonRepository: ISeasonRepository;
  private static leagueRepository: ILeagueRepository;
  private static cleanupRepository: ICleanupRepository;
  private static sponsorRepository: ISponsorRepository;

  static getLeagueRepository(): ILeagueRepository {
    if (!this.leagueRepository) {
      this.leagueRepository = new PrismaLeagueRepository(prisma);
    }
    return this.leagueRepository;
  }

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

  static getRoleRepository(): IRoleRepository {
    if (!this.roleRepository) {
      this.roleRepository = new PrismaRoleRepository(prisma);
    }
    return this.roleRepository;
  }

  static getSeasonRepository(): ISeasonRepository {
    if (!this.seasonRepository) {
      this.seasonRepository = new PrismaSeasonRepository(prisma);
    }
    return this.seasonRepository;
  }

  static getCleanupRepository(): ICleanupRepository {
    if (!this.cleanupRepository) {
      this.cleanupRepository = new PrismaCleanupRepository(prisma);
    }
    return this.cleanupRepository;
  }

  static getSponsorRepository(): ISponsorRepository {
    if (!this.sponsorRepository) {
      this.sponsorRepository = new PrismaSponsorRepository(prisma);
    }
    return this.sponsorRepository;
  }
}

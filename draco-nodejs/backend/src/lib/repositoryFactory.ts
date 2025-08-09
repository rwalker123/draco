import {
  IUserRepository,
  ITeamRepository,
  IAccountRepository,
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaAccountRepository,
} from '../repositories/index.js';
import prisma from './prisma.js';

/**
 * Factory functions to create repository instances
 * This provides a clean way to access repositories without direct Prisma dependencies
 */
export class RepositoryFactory {
  private static userRepository: IUserRepository;
  private static teamRepository: ITeamRepository;
  private static accountRepository: IAccountRepository;

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

  // For testing - allows injection of custom repositories
  static setUserRepository(repository: IUserRepository): void {
    this.userRepository = repository;
  }

  static setTeamRepository(repository: ITeamRepository): void {
    this.teamRepository = repository;
  }

  static setAccountRepository(repository: IAccountRepository): void {
    this.accountRepository = repository;
  }
}

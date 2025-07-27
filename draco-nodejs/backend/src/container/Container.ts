import { PrismaClient } from '@prisma/client';
import {
  IUserRepository,
  ITeamRepository,
  IAccountRepository,
  PrismaUserRepository,
  PrismaTeamRepository,
  PrismaAccountRepository,
} from '../repositories';

/**
 * Dependency injection container for managing repositories and services
 */
export class Container {
  private userRepository: IUserRepository;
  private teamRepository: ITeamRepository;
  private accountRepository: IAccountRepository;

  constructor(private prisma: PrismaClient) {
    this.userRepository = new PrismaUserRepository(prisma);
    this.teamRepository = new PrismaTeamRepository(prisma);
    this.accountRepository = new PrismaAccountRepository(prisma);
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getTeamRepository(): ITeamRepository {
    return this.teamRepository;
  }

  getAccountRepository(): IAccountRepository {
    return this.accountRepository;
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }
}

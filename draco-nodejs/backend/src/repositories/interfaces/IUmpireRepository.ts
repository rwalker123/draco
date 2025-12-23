import { leagueumpires } from '#prisma/client';
import { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export interface UmpireCreateData {
  accountid: bigint;
  contactid: bigint;
}

export interface UmpireFindOptions {
  skip: number;
  take: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IUmpireRepository {
  findById(id: bigint): Promise<leagueumpires | null>;
  findMany(where?: Record<string, unknown>): Promise<leagueumpires[]>;
  create(data: UmpireCreateData): Promise<leagueumpires>;
  update(id: bigint, data: Partial<leagueumpires>): Promise<leagueumpires>;
  delete(id: bigint): Promise<leagueumpires>;
  count(where?: Record<string, unknown>): Promise<number>;
  findByAccount(
    accountId: bigint,
    options: UmpireFindOptions,
  ): Promise<dbLeagueUmpireWithContact[]>;
  findByAccountAndId(
    accountId: bigint,
    umpireId: bigint,
  ): Promise<dbLeagueUmpireWithContact | null>;
  findByAccountAndContact(
    accountId: bigint,
    contactId: bigint,
  ): Promise<dbLeagueUmpireWithContact | null>;
  countByAccount(accountId: bigint): Promise<number>;
}

import { dbLeaderCategoryConfig } from '../types/dbTypes.js';

export interface ILeagueLeadersDisplayRepository {
  findLeaderCategories(accountId: bigint): Promise<dbLeaderCategoryConfig[]>;
  findCategory(accountId: bigint, fieldName: string): Promise<dbLeaderCategoryConfig | null>;
}

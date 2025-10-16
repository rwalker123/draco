import { accounthandouts, teamhandouts } from '@prisma/client';
import { dbAccountHandout, dbTeamHandout } from '../types/index.js';

export interface IHandoutRepository {
  listAccountHandouts(accountId: bigint): Promise<dbAccountHandout[]>;
  createAccountHandout(data: Partial<accounthandouts>): Promise<accounthandouts>;
  findAccountHandoutById(handoutId: bigint, accountId: bigint): Promise<dbAccountHandout | null>;
  updateAccountHandout(handoutId: bigint, data: Partial<accounthandouts>): Promise<accounthandouts>;
  deleteAccountHandout(handoutId: bigint): Promise<void>;

  listTeamHandouts(teamId: bigint): Promise<dbTeamHandout[]>;
  createTeamHandout(data: Partial<teamhandouts>): Promise<teamhandouts>;
  findTeamHandoutById(handoutId: bigint, teamId: bigint): Promise<dbTeamHandout | null>;
  updateTeamHandout(handoutId: bigint, data: Partial<teamhandouts>): Promise<teamhandouts>;
  deleteTeamHandout(handoutId: bigint): Promise<void>;
}

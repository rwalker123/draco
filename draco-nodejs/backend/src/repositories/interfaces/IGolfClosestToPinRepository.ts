import { golfclosesttopin, contacts, golfmatch } from '#prisma/client';

export type GolfClosestToPinWithDetails = golfclosesttopin & {
  contacts: Pick<contacts, 'id' | 'firstname' | 'lastname'>;
  golfmatch: Pick<golfmatch, 'id' | 'matchdate' | 'weeknumber'>;
};

export type CreateGolfClosestToPinData = {
  matchid: bigint;
  holeno: number;
  contactid: bigint;
  distance: number;
  unit: string;
  enteredby: string;
};

export type UpdateGolfClosestToPinData = {
  contactid?: bigint;
  distance?: number;
  unit?: string;
};

export interface IGolfClosestToPinRepository {
  findById(id: bigint): Promise<GolfClosestToPinWithDetails | null>;
  findByMatchId(matchId: bigint): Promise<GolfClosestToPinWithDetails[]>;
  findByFlightId(flightId: bigint): Promise<GolfClosestToPinWithDetails[]>;
  create(data: CreateGolfClosestToPinData): Promise<golfclosesttopin>;
  update(id: bigint, data: UpdateGolfClosestToPinData): Promise<golfclosesttopin>;
  delete(id: bigint): Promise<golfclosesttopin>;
}

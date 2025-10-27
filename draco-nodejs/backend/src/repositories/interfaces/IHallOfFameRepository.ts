import {
  dbHofClassSummary,
  dbHofEligibleContact,
  dbHofMemberWithContact,
} from '../types/dbTypes.js';

export interface CreateHallOfFameMemberData {
  contactId: bigint;
  yearInducted: number;
  biographyHtml?: string | null;
}

export interface UpdateHallOfFameMemberData {
  yearInducted?: number;
  biographyHtml?: string | null;
}

export interface HallOfFameEligibleContactsResult {
  contacts: dbHofEligibleContact[];
  total: number;
}

export interface IHallOfFameRepository {
  listClasses(accountId: bigint): Promise<dbHofClassSummary[]>;
  listMembersByYear(accountId: bigint, year: number): Promise<dbHofMemberWithContact[]>;
  getRandomMember(accountId: bigint): Promise<dbHofMemberWithContact | null>;
  findMemberById(accountId: bigint, memberId: bigint): Promise<dbHofMemberWithContact | null>;
  findMemberByContact(accountId: bigint, contactId: bigint): Promise<dbHofMemberWithContact | null>;
  createMember(
    accountId: bigint,
    data: CreateHallOfFameMemberData,
  ): Promise<dbHofMemberWithContact>;
  updateMember(
    accountId: bigint,
    memberId: bigint,
    data: UpdateHallOfFameMemberData,
  ): Promise<dbHofMemberWithContact | null>;
  deleteMember(accountId: bigint, memberId: bigint): Promise<boolean>;
  findEligibleContacts(
    accountId: bigint,
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<HallOfFameEligibleContactsResult>;
}

import { Prisma, PrismaClient } from '#prisma/client';
import {
  CreateHallOfFameMemberData,
  HallOfFameEligibleContactsResult,
  IHallOfFameRepository,
  UpdateHallOfFameMemberData,
} from '../interfaces/IHallOfFameRepository.js';
import { dbHofClassSummary, dbHofMemberWithContact } from '../types/dbTypes.js';

const CONTACT_ORDER_BY: Prisma.contactsOrderByWithRelationInput[] = [
  { lastname: 'asc' },
  { firstname: 'asc' },
  { middlename: 'asc' },
];

const CONTACT_SELECTION = {
  id: true,
  firstname: true,
  lastname: true,
  middlename: true,
  creatoraccountid: true,
} satisfies Prisma.contactsSelect;

const MEMBER_INCLUDE = {
  contacts: {
    select: CONTACT_SELECTION,
  },
} satisfies Prisma.hofInclude;

export class PrismaHallOfFameRepository implements IHallOfFameRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listClasses(accountId: bigint): Promise<dbHofClassSummary[]> {
    const results = await this.prisma.hof.groupBy({
      by: ['yearinducted'],
      where: {
        accountid: accountId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        yearinducted: 'desc',
      },
    });

    return results.map((entry) => ({
      year: entry.yearinducted,
      memberCount: Number(entry._count?._all ?? 0),
    }));
  }

  async listMembersByYear(accountId: bigint, year: number): Promise<dbHofMemberWithContact[]> {
    return this.prisma.hof.findMany({
      where: {
        accountid: accountId,
        yearinducted: year,
      },
      include: MEMBER_INCLUDE,
      orderBy: [
        { contacts: { lastname: 'asc' } },
        { contacts: { firstname: 'asc' } },
        { contacts: { middlename: 'asc' } },
      ],
    });
  }

  async getRandomMembers(accountId: bigint, limit: number): Promise<dbHofMemberWithContact[]> {
    const total = await this.prisma.hof.count({
      where: {
        accountid: accountId,
      },
    });

    if (total === 0) {
      return [];
    }

    const safeLimit = Math.max(1, Math.min(limit, total));
    const maxOffset = Math.max(total - safeLimit, 0);
    const offset = maxOffset > 0 ? Math.floor(Math.random() * (maxOffset + 1)) : 0;

    return this.prisma.hof.findMany({
      where: {
        accountid: accountId,
      },
      include: MEMBER_INCLUDE,
      orderBy: {
        id: 'asc',
      },
      skip: offset,
      take: safeLimit,
    });
  }

  async findMemberById(
    accountId: bigint,
    memberId: bigint,
  ): Promise<dbHofMemberWithContact | null> {
    return this.prisma.hof.findFirst({
      where: {
        id: memberId,
        accountid: accountId,
      },
      include: MEMBER_INCLUDE,
    });
  }

  async findMemberByContact(
    accountId: bigint,
    contactId: bigint,
  ): Promise<dbHofMemberWithContact | null> {
    return this.prisma.hof.findFirst({
      where: {
        accountid: accountId,
        contactid: contactId,
      },
      include: MEMBER_INCLUDE,
    });
  }

  async createMember(
    accountId: bigint,
    data: CreateHallOfFameMemberData,
  ): Promise<dbHofMemberWithContact> {
    const created = await this.prisma.hof.create({
      data: {
        accountid: accountId,
        contactid: data.contactId,
        yearinducted: data.yearInducted,
        bio: data.biographyHtml ?? '',
      },
    });

    const member = await this.findMemberById(accountId, created.id);
    if (!member) {
      throw new Error('Failed to load created Hall of Fame member.');
    }

    return member;
  }

  async updateMember(
    accountId: bigint,
    memberId: bigint,
    data: UpdateHallOfFameMemberData,
  ): Promise<dbHofMemberWithContact | null> {
    const existing = await this.findMemberById(accountId, memberId);
    if (!existing) {
      return null;
    }

    const updateData: Prisma.hofUpdateArgs['data'] = {};

    if (data.yearInducted !== undefined) {
      updateData.yearinducted = data.yearInducted;
    }

    if (data.biographyHtml !== undefined) {
      updateData.bio = data.biographyHtml ?? '';
    }

    await this.prisma.hof.update({
      where: {
        id: memberId,
      },
      data: updateData,
    });

    return this.findMemberById(accountId, memberId);
  }

  async deleteMember(accountId: bigint, memberId: bigint): Promise<boolean> {
    const existing = await this.findMemberById(accountId, memberId);
    if (!existing) {
      return false;
    }

    await this.prisma.hof.delete({
      where: {
        id: memberId,
      },
    });

    return true;
  }

  async findEligibleContacts(
    accountId: bigint,
    search: string | undefined,
    skip: number,
    take: number,
  ): Promise<HallOfFameEligibleContactsResult> {
    const where: Prisma.contactsWhereInput = {
      creatoraccountid: accountId,
      hof: {
        none: {
          accountid: accountId,
        },
      },
    };

    if (search) {
      const tokens = search
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);

      if (tokens.length > 0) {
        where.AND = tokens.map((token) => ({
          OR: [
            {
              firstname: {
                contains: token,
                mode: 'insensitive',
              },
            },
            {
              lastname: {
                contains: token,
                mode: 'insensitive',
              },
            },
            {
              middlename: {
                contains: token,
                mode: 'insensitive',
              },
            },
          ],
        }));
      }
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contacts.findMany({
        where,
        select: CONTACT_SELECTION,
        orderBy: CONTACT_ORDER_BY,
        skip,
        take,
      }),
      this.prisma.contacts.count({ where }),
    ]);

    return {
      contacts,
      total,
    };
  }
}

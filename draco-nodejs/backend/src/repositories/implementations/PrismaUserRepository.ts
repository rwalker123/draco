import { Prisma, PrismaClient, aspnetusers, aspnetroles, aspnetuserroles } from '#prisma/client';
import {
  AdminUserListFilters,
  AdminUserListItem,
  AdminUserListResult,
  IUserRepository,
} from '../interfaces/IUserRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(_id: bigint): Promise<aspnetusers | null> {
    throw Error('findById is not implemented due to no bigint id in users table');
  }

  async findMany(where?: Record<string, unknown>): Promise<aspnetusers[]> {
    return this.prisma.aspnetusers.findMany({ where });
  }

  async create(data: Partial<aspnetusers>): Promise<aspnetusers> {
    const normalizedData = {
      ...data,
      username: data.username?.toLowerCase().trim(),
    };
    return this.prisma.aspnetusers.create({
      data: normalizedData as Parameters<typeof this.prisma.aspnetusers.create>[0]['data'],
    });
  }

  async update(_id: bigint, _data: Partial<aspnetusers>): Promise<aspnetusers> {
    throw Error('update is not implemented due to no bigint id in users table');
  }

  async delete(_id: bigint): Promise<aspnetusers> {
    throw Error('delete is not implemented due to no bigint id in users table');
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.aspnetusers.count({ where });
  }

  async findByUsername(username: string): Promise<aspnetusers | null> {
    return this.prisma.aspnetusers.findUnique({
      where: {
        username: username.toLowerCase().trim(),
      },
    });
  }

  async findByUserId(userId: string): Promise<aspnetusers | null> {
    return this.prisma.aspnetusers.findUnique({
      where: { id: userId },
    });
  }

  async findWithRoles(
    userId: string,
  ): Promise<
    (aspnetusers & { aspnetuserroles: (aspnetuserroles & { aspnetroles: aspnetroles })[] }) | null
  > {
    return this.prisma.aspnetusers.findUnique({
      where: { id: userId },
      include: {
        aspnetuserroles: {
          include: {
            aspnetroles: true,
          },
        },
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<aspnetusers> {
    return this.prisma.aspnetusers.update({
      where: { id: userId },
      data: { passwordhash: hashedPassword },
    });
  }

  async updateUser(userId: string, data: Partial<aspnetusers>): Promise<aspnetusers> {
    const normalizedData = {
      ...data,
      ...(data.username && { username: data.username.toLowerCase().trim() }),
    };
    return this.prisma.aspnetusers.update({
      where: { id: userId },
      data: normalizedData,
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.aspnetusers.delete({
      where: { id: userId },
    });
  }

  async countContactsForUser(userId: string): Promise<number> {
    return this.prisma.contacts.count({
      where: { userid: userId },
    });
  }

  async countAccountsOwnedByUser(userId: string): Promise<number> {
    return this.prisma.accounts.count({
      where: { owneruserid: userId },
    });
  }

  async searchAdminUsers(filters: AdminUserListFilters): Promise<AdminUserListResult> {
    const { search, orphansOnly, limit, offset } = filters;

    const trimmedSearch = search?.trim();
    const searchPattern = trimmedSearch ? `%${trimmedSearch}%` : null;

    const conditions: Prisma.Sql[] = [];
    if (searchPattern) {
      conditions.push(Prisma.sql`u.username ILIKE ${searchPattern}`);
    }
    if (orphansOnly) {
      conditions.push(Prisma.sql`COALESCE(c.contact_count, 0) = 0`);
    }
    const whereClause =
      conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        username: string | null;
        accessfailedcount: number;
        lockoutenddateutc: Date | null;
        passwordhash: string | null;
        contact_count: bigint;
      }>
    >(
      Prisma.sql`
        SELECT
          u.id,
          u.username,
          u.accessfailedcount,
          u.lockoutenddateutc,
          u.passwordhash,
          COALESCE(c.contact_count, 0) AS contact_count
        FROM aspnetusers u
        LEFT JOIN (
          SELECT userid, COUNT(*)::bigint AS contact_count
          FROM contacts
          WHERE userid IS NOT NULL
          GROUP BY userid
        ) c ON c.userid = u.id
        ${whereClause}
        ORDER BY u.username ASC NULLS LAST
        LIMIT ${limit}
        OFFSET ${offset}
      `,
    );

    const totalRows = await this.prisma.$queryRaw<Array<{ total: bigint }>>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT u.id
          FROM aspnetusers u
          LEFT JOIN (
            SELECT userid, COUNT(*)::bigint AS contact_count
            FROM contacts
            WHERE userid IS NOT NULL
            GROUP BY userid
          ) c ON c.userid = u.id
          ${whereClause}
        ) AS filtered
      `,
    );

    const users: AdminUserListItem[] = rows.map((row) => ({
      id: row.id,
      username: row.username ?? '',
      contactCount: Number(row.contact_count ?? 0n),
      accessFailedCount: row.accessfailedcount,
      lockoutEndDateUtc: row.lockoutenddateutc,
      hasPassword: Boolean(row.passwordhash && row.passwordhash.length > 0),
    }));

    const total = Number(totalRows[0]?.total ?? 0n);

    return { users, total };
  }
}

import { PrismaClient, aspnetusers, aspnetroles, aspnetuserroles } from '#prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository.js';

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
}

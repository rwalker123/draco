import { PrismaClient, aspnetusers, aspnetuserroles, aspnetroles } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository.js';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string | number): Promise<aspnetusers | null> {
    return this.prisma.aspnetusers.findUnique({
      where: { id: String(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<aspnetusers[]> {
    return this.prisma.aspnetusers.findMany({ where });
  }

  async create(data: Partial<aspnetusers>): Promise<aspnetusers> {
    return this.prisma.aspnetusers.create({
      data: data as Parameters<typeof this.prisma.aspnetusers.create>[0]['data'],
    });
  }

  async update(id: string | number, data: Partial<aspnetusers>): Promise<aspnetusers> {
    return this.prisma.aspnetusers.update({
      where: { id: String(id) },
      data,
    });
  }

  async delete(id: string | number): Promise<aspnetusers> {
    return this.prisma.aspnetusers.delete({
      where: { id: String(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.aspnetusers.count({ where });
  }

  async findByEmail(email: string): Promise<aspnetusers | null> {
    return this.prisma.aspnetusers.findFirst({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<aspnetusers | null> {
    return this.prisma.aspnetusers.findUnique({
      where: { username },
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
}

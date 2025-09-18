import { PrismaClient, contacts } from '@prisma/client';
import { IContactRepository } from '../interfaces/index.js';
import { dbRosterPlayer } from '../types/dbTypes.js';

export class PrismaContactRepository implements IContactRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<contacts | null> {
    return this.prisma.contacts.findUnique({
      where: { id: BigInt(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<contacts[]> {
    return this.prisma.contacts.findMany({ where });
  }

  async create(data: Partial<contacts>): Promise<contacts> {
    return this.prisma.contacts.create({
      data: data as Parameters<typeof this.prisma.contacts.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<contacts>): Promise<contacts> {
    return this.prisma.contacts.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<contacts> {
    return this.prisma.contacts.delete({
      where: { id: BigInt(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.contacts.count({ where });
  }

  async findRosterByContactId(contactId: bigint): Promise<dbRosterPlayer | null> {
    return await this.prisma.roster.findFirst({
      where: { contactid: contactId },
      include: { contacts: true },
    });
  }
}

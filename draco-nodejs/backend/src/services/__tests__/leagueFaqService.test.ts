import { describe, expect, it, beforeEach } from 'vitest';
import { LeagueFaqService } from '../LeagueFaqService.js';
import { ILeagueFaqRepository, dbLeagueFaq } from '../../repositories/index.js';
import { leaguefaq } from '@prisma/client';
import { NotFoundError } from '../../utils/customErrors.js';

const makeDbFaq = (overrides: Partial<dbLeagueFaq> = {}): dbLeagueFaq => ({
  id: 1n,
  accountid: 10n,
  question: 'Original question',
  answer: 'Original answer',
  ...overrides,
});

const cloneDbFaq = (faq: dbLeagueFaq): dbLeagueFaq => ({
  id: faq.id,
  accountid: faq.accountid,
  question: faq.question,
  answer: faq.answer,
});

describe('LeagueFaqService', () => {
  const accountId = 10n;
  let faqs: dbLeagueFaq[];
  let nextId: bigint;
  let repository: ILeagueFaqRepository;
  let service: LeagueFaqService;

  beforeEach(() => {
    faqs = [
      makeDbFaq({
        question: '  Why is the sky blue?  ',
        answer: '  The atmosphere scatters sunlight.  ',
      }),
    ];
    nextId = 2n;

    repository = {
      async listByAccount(requestedAccountId: bigint): Promise<dbLeagueFaq[]> {
        return faqs.filter((faq) => faq.accountid === requestedAccountId).map(cloneDbFaq);
      },
      async findByIdForAccount(
        faqId: bigint,
        requestedAccountId: bigint,
      ): Promise<dbLeagueFaq | null> {
        const found = faqs.find((faq) => faq.id === faqId && faq.accountid === requestedAccountId);
        return found ? cloneDbFaq(found) : null;
      },
      async create(data: Partial<leaguefaq>): Promise<leaguefaq> {
        const id = nextId;
        nextId += 1n;
        const accountid = data.accountid as bigint;
        const question = data.question as string;
        const answer = data.answer as string;
        const record: dbLeagueFaq = {
          id,
          accountid,
          question,
          answer,
        };
        faqs.push(record);
        return { ...record } as leaguefaq;
      },
      async update(faqId: bigint, data: Partial<leaguefaq>): Promise<leaguefaq> {
        const index = faqs.findIndex((faq) => faq.id === faqId);
        if (index === -1) {
          throw new NotFoundError('faq not found');
        }
        const current = faqs[index];
        const updated: dbLeagueFaq = {
          id: current.id,
          accountid: current.accountid,
          question: (data.question as string | undefined) ?? current.question,
          answer: (data.answer as string | undefined) ?? current.answer,
        };
        faqs[index] = updated;
        return { ...updated } as leaguefaq;
      },
      async delete(faqId: bigint): Promise<leaguefaq> {
        const index = faqs.findIndex((faq) => faq.id === faqId);
        if (index === -1) {
          throw new NotFoundError('faq not found');
        }
        const [removed] = faqs.splice(index, 1);
        return { ...removed } as leaguefaq;
      },
      async findById(faqId: bigint): Promise<leaguefaq | null> {
        const found = faqs.find((faq) => faq.id === faqId);
        return found ? ({ ...found } as leaguefaq) : null;
      },
      async findMany(): Promise<leaguefaq[]> {
        return faqs.map((faq) => ({ ...faq }) as leaguefaq);
      },
      async count(): Promise<number> {
        return faqs.length;
      },
    } satisfies ILeagueFaqRepository;

    service = new LeagueFaqService(repository);
  });

  it('lists FAQs for an account with trimmed output', async () => {
    const result = await service.listAccountFaqs(accountId);

    expect(result).toEqual([
      {
        id: faqs[0].id.toString(),
        accountId: faqs[0].accountid.toString(),
        question: 'Why is the sky blue?',
        answer: 'The atmosphere scatters sunlight.',
      },
    ]);
  });

  it('retrieves a single FAQ', async () => {
    const result = await service.getAccountFaq(accountId, faqs[0].id);

    expect(result.id).toBe(faqs[0].id.toString());
    expect(result.question).toBe('Why is the sky blue?');
  });

  it('throws when FAQ is missing', async () => {
    await expect(service.getAccountFaq(accountId, 999n)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates a FAQ with trimmed fields', async () => {
    const result = await service.createAccountFaq(accountId, {
      question: '  When do games start?  ',
      answer: '  Check the schedule.  ',
    });

    expect(result.accountId).toBe(accountId.toString());
    expect(result.question).toBe('When do games start?');
    expect(result.answer).toBe('Check the schedule.');

    const stored = faqs.find((faq) => faq.id === BigInt(result.id));
    expect(stored?.question).toBe('When do games start?');
    expect(stored?.answer).toBe('Check the schedule.');
  });

  it('updates an existing FAQ', async () => {
    const targetId = faqs[0].id;

    const result = await service.updateAccountFaq(accountId, targetId, {
      question: 'Updated question',
      answer: 'Updated answer',
    });

    expect(result.question).toBe('Updated question');
    expect(result.answer).toBe('Updated answer');

    const stored = faqs.find((faq) => faq.id === targetId);
    expect(stored?.question).toBe('Updated question');
  });

  it('deletes an existing FAQ', async () => {
    const targetId = faqs[0].id;

    await service.deleteAccountFaq(accountId, targetId);

    expect(faqs).toHaveLength(0);
  });
});

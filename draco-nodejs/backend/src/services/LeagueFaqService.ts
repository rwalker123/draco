import { LeagueFaqType, UpsertLeagueFaqType } from '@draco/shared-schemas';
import { RepositoryFactory, ILeagueFaqRepository, dbLeagueFaq } from '../repositories/index.js';
import { LeagueFaqResponseFormatter } from '../responseFormatters/index.js';
import { NotFoundError } from '../utils/customErrors.js';

export class LeagueFaqService {
  private readonly leagueFaqRepository: ILeagueFaqRepository;

  constructor(leagueFaqRepository?: ILeagueFaqRepository) {
    this.leagueFaqRepository = leagueFaqRepository ?? RepositoryFactory.getLeagueFaqRepository();
  }

  async listAccountFaqs(accountId: bigint): Promise<LeagueFaqType[]> {
    const faqs = await this.leagueFaqRepository.listByAccount(accountId);
    return LeagueFaqResponseFormatter.formatMany(faqs);
  }

  async getAccountFaq(accountId: bigint, faqId: bigint): Promise<LeagueFaqType> {
    const faq = await this.requireFaq(accountId, faqId);
    return LeagueFaqResponseFormatter.format(faq);
  }

  async createAccountFaq(accountId: bigint, payload: UpsertLeagueFaqType): Promise<LeagueFaqType> {
    const writeData = this.buildWriteData(payload);
    const created = await this.leagueFaqRepository.create({
      accountid: accountId,
      ...writeData,
    });
    const record = await this.leagueFaqRepository.findByIdForAccount(created.id, accountId);

    if (!record) {
      throw new NotFoundError('League FAQ not found');
    }

    return LeagueFaqResponseFormatter.format(record);
  }

  async updateAccountFaq(
    accountId: bigint,
    faqId: bigint,
    payload: UpsertLeagueFaqType,
  ): Promise<LeagueFaqType> {
    await this.requireFaq(accountId, faqId);

    const writeData = this.buildWriteData(payload);
    await this.leagueFaqRepository.update(faqId, writeData);

    const record = await this.leagueFaqRepository.findByIdForAccount(faqId, accountId);
    if (!record) {
      throw new NotFoundError('League FAQ not found');
    }

    return LeagueFaqResponseFormatter.format(record);
  }

  async deleteAccountFaq(accountId: bigint, faqId: bigint): Promise<void> {
    await this.requireFaq(accountId, faqId);
    await this.leagueFaqRepository.delete(faqId);
  }

  private async requireFaq(accountId: bigint, faqId: bigint): Promise<dbLeagueFaq> {
    const faq = await this.leagueFaqRepository.findByIdForAccount(faqId, accountId);

    if (!faq) {
      throw new NotFoundError('League FAQ not found');
    }

    return faq;
  }

  private buildWriteData(payload: UpsertLeagueFaqType): { question: string; answer: string } {
    const question = payload.question.trim();
    const answer = payload.answer.trim();

    return {
      question,
      answer,
    };
  }
}

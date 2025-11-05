import { LeagueFaqType } from '@draco/shared-schemas';
import { dbLeagueFaq } from '../repositories/index.js';

export class LeagueFaqResponseFormatter {
  static format(faq: dbLeagueFaq): LeagueFaqType {
    return {
      id: faq.id.toString(),
      accountId: faq.accountid.toString(),
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    } satisfies LeagueFaqType;
  }

  static formatMany(faqs: dbLeagueFaq[]): LeagueFaqType[] {
    return faqs.map((faq) => this.format(faq));
  }
}

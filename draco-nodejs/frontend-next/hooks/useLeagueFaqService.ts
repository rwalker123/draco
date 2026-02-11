'use client';

import {
  listLeagueFaqs,
  createLeagueFaq,
  updateLeagueFaq,
  deleteLeagueFaq,
} from '@draco/shared-api-client';
import type { LeagueFaqListType, LeagueFaqType, UpsertLeagueFaqType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export type LeagueFaqServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface LeagueFaqService {
  listFaqs: () => Promise<LeagueFaqServiceResult<LeagueFaqType[]>>;
  createFaq: (payload: UpsertLeagueFaqType) => Promise<LeagueFaqServiceResult<LeagueFaqType>>;
  updateFaq: (
    faqId: string,
    payload: UpsertLeagueFaqType,
  ) => Promise<LeagueFaqServiceResult<LeagueFaqType>>;
  deleteFaq: (faqId: string) => Promise<LeagueFaqServiceResult<null>>;
}

const sanitizePayload = (payload: UpsertLeagueFaqType): UpsertLeagueFaqType => ({
  question: payload.question.trim(),
  answer: payload.answer.trim(),
});

export const useLeagueFaqService = (accountId: string): LeagueFaqService => {
  const apiClient = useApiClient();

  const listFaqs: LeagueFaqService['listFaqs'] = async () => {
    try {
      const result = await listLeagueFaqs({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to load FAQs') as LeagueFaqListType;
      const faqs = Array.isArray(data) ? data : [];

      return {
        success: true,
        data: faqs as LeagueFaqType[],
        message: 'FAQs loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load FAQs';
      return { success: false, error: message } as const;
    }
  };

  const createFaq: LeagueFaqService['createFaq'] = async (payload) => {
    try {
      const result = await createLeagueFaq({
        client: apiClient,
        path: { accountId },
        body: sanitizePayload(payload),
        throwOnError: false,
      });

      const faq = unwrapApiResult(result, 'Failed to create FAQ') as LeagueFaqType;

      return {
        success: true,
        data: faq,
        message: 'FAQ created successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create FAQ';
      return { success: false, error: message } as const;
    }
  };

  const updateFaq: LeagueFaqService['updateFaq'] = async (faqId, payload) => {
    try {
      const result = await updateLeagueFaq({
        client: apiClient,
        path: { accountId, faqId },
        body: sanitizePayload(payload),
        throwOnError: false,
      });

      const faq = unwrapApiResult(result, 'Failed to update FAQ') as LeagueFaqType;

      return {
        success: true,
        data: faq,
        message: 'FAQ updated successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update FAQ';
      return { success: false, error: message } as const;
    }
  };

  const deleteFaq: LeagueFaqService['deleteFaq'] = async (faqId) => {
    try {
      const result = await deleteLeagueFaq({
        client: apiClient,
        path: { accountId, faqId },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete FAQ');

      return {
        success: true,
        data: null,
        message: 'FAQ deleted successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete FAQ';
      return { success: false, error: message } as const;
    }
  };

  return {
    listFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
  };
};

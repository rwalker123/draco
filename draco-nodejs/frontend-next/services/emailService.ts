// Email Service for Frontend API Integration
// Handles all communication with the email backend APIs

import axios, { AxiosResponse } from 'axios';
import type {
  EmailComposeRequest,
  EmailTemplate,
  EmailTemplateCreateRequest,
  EmailTemplateUpdateRequest,
  EmailRecord,
  EmailStatus,
  EmailRecipient,
  EmailListResponse,
  AttachmentDetails,
  ApiResponse,
} from '../types/emails/email';

// Email service class
export class EmailService {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string = '/api') {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private getMultipartHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }

  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'API request failed');
    }
    return response.data.data;
  }

  // Email Composition Methods

  async composeEmail(accountId: string, request: EmailComposeRequest): Promise<string> {
    try {
      const response = await axios.post<ApiResponse<{ emailId: string }>>(
        `${this.baseUrl}/accounts/${accountId}/emails/compose`,
        request,
        { headers: this.getHeaders() },
      );
      return this.handleResponse(response).emailId;
    } catch (error) {
      // Handle axios errors and extract server error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          // Extract error message from server response
          const serverError = error.response.data.error || error.response.data.message;
          if (serverError) {
            throw new Error(serverError);
          }
        }
        // Fall back to axios error message
        throw new Error(error.message);
      }
      // Re-throw non-axios errors
      throw error;
    }
  }

  async listEmails(
    accountId: string,
    page = 1,
    limit = 25,
    status?: EmailStatus,
  ): Promise<EmailListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await axios.get<ApiResponse<EmailListResponse>>(
      `${this.baseUrl}/accounts/${accountId}/emails?${params.toString()}`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response);
  }

  async getEmail(accountId: string, emailId: string): Promise<EmailRecord> {
    const response = await axios.get<ApiResponse<{ email: EmailRecord }>>(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response).email;
  }

  async getEmailRecipients(accountId: string, emailId: string): Promise<EmailRecipient[]> {
    const response = await axios.get<ApiResponse<{ recipients: EmailRecipient[] }>>(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}/recipients`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response).recipients;
  }

  // Email Template Methods

  async createTemplate(
    accountId: string,
    template: EmailTemplateCreateRequest,
  ): Promise<EmailTemplate> {
    const response = await axios.post<ApiResponse<{ template: EmailTemplate }>>(
      `${this.baseUrl}/accounts/${accountId}/email-templates`,
      template,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response).template;
  }

  async listTemplates(accountId: string): Promise<EmailTemplate[]> {
    const response = await axios.get<ApiResponse<{ templates: EmailTemplate[] }>>(
      `${this.baseUrl}/accounts/${accountId}/email-templates`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response).templates;
  }

  async getTemplate(accountId: string, templateId: string): Promise<EmailTemplate> {
    const response = await axios.get<ApiResponse<EmailTemplate>>(
      `${this.baseUrl}/accounts/${accountId}/email-templates/${templateId}`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response);
  }

  async updateTemplate(
    accountId: string,
    templateId: string,
    updates: EmailTemplateUpdateRequest,
  ): Promise<EmailTemplate> {
    const response = await axios.put<ApiResponse<EmailTemplate>>(
      `${this.baseUrl}/accounts/${accountId}/email-templates/${templateId}`,
      updates,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response);
  }

  async deleteTemplate(accountId: string, templateId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/accounts/${accountId}/email-templates/${templateId}`, {
      headers: this.getHeaders(),
    });
  }

  async previewTemplate(
    accountId: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<{ subject: string; body: string }> {
    const response = await axios.post<ApiResponse<{ subject: string; body: string }>>(
      `${this.baseUrl}/accounts/${accountId}/email-templates/${templateId}/preview`,
      { variables },
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response);
  }

  // Attachment Methods

  async uploadAttachments(
    accountId: string,
    emailId: string,
    files: File[],
  ): Promise<AttachmentDetails[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await axios.post<ApiResponse<{ attachments: AttachmentDetails[] }>>(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}/attachments`,
      formData,
      { headers: this.getMultipartHeaders() },
    );
    return this.handleResponse(response).attachments;
  }

  async listAttachments(accountId: string, emailId: string): Promise<AttachmentDetails[]> {
    const response = await axios.get<ApiResponse<{ attachments: AttachmentDetails[] }>>(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}/attachments`,
      { headers: this.getHeaders() },
    );
    return this.handleResponse(response).attachments;
  }

  async downloadAttachment(
    accountId: string,
    emailId: string,
    attachmentId: string,
  ): Promise<Blob> {
    const response = await axios.get(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}/attachments/${attachmentId}`,
      {
        headers: this.getHeaders(),
        responseType: 'blob',
      },
    );
    return response.data;
  }

  async deleteAttachment(accountId: string, emailId: string, attachmentId: string): Promise<void> {
    await axios.delete(
      `${this.baseUrl}/accounts/${accountId}/emails/${emailId}/attachments/${attachmentId}`,
      { headers: this.getHeaders() },
    );
  }
}

// Factory function to create email service
export const createEmailService = (token: string): EmailService => {
  return new EmailService(token);
};

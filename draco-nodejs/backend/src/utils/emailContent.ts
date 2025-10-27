// Shared helpers for processing email content across providers/services

export const htmlToPlainText = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<(\/?)(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
};

export const stripHtml = htmlToPlainText;

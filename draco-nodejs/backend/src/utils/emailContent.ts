// Shared helpers for processing email content across providers/services

export const htmlToPlainText = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const withoutScriptsAndStyles = value
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<(\/?)(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return withoutScriptsAndStyles
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const stripHtml = htmlToPlainText;

const BLOCK_TAGS = 'p|div|h[1-6]|li|blockquote|pre';
const BR = '<br\\s*/?>';
const EMPTY_BLOCK_INNER = `(?:\\s|&nbsp;|${BR})*`;
const EMPTY_BLOCK = `<(${BLOCK_TAGS})\\b[^>]*>${EMPTY_BLOCK_INNER}</\\1\\s*>`;

export const collapseHtmlBlankLines = (
  html: string | null | undefined,
  maxBlankLines = 1,
): string => {
  if (!html) {
    return '';
  }

  const limit = Math.max(0, maxBlankLines);
  let result = html;

  const brRun = new RegExp(`(?:${BR}\\s*){${limit + 1},}`, 'gi');
  result = result.replace(brRun, '<br>'.repeat(limit));

  const emptyBlockRun = new RegExp(`(?:${EMPTY_BLOCK}\\s*){${limit + 1},}`, 'gi');
  result = result.replace(emptyBlockRun, (match) => {
    if (limit === 0) {
      return '';
    }
    const blocks = match.match(new RegExp(EMPTY_BLOCK, 'gi')) ?? [];
    return blocks.slice(0, limit).join('');
  });

  const BLANK_UNIT = `(?:${EMPTY_BLOCK}|${BR})`;
  const leadingBlanks = new RegExp(`^(?:\\s*${BLANK_UNIT})+`, 'i');
  const trailingBlanks = new RegExp(`(?:${BLANK_UNIT}\\s*)+$`, 'i');
  result = result.replace(leadingBlanks, '').replace(trailingBlanks, '');

  return result.trim();
};

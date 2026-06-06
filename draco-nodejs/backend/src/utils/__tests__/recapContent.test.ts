import { describe, expect, it } from 'vitest';

import { collapseHtmlBlankLines } from '../recapContent.js';

describe('collapseHtmlBlankLines', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(collapseHtmlBlankLines(null)).toBe('');
    expect(collapseHtmlBlankLines(undefined)).toBe('');
    expect(collapseHtmlBlankLines('')).toBe('');
  });

  it('collapses a long run of empty paragraphs between content to one blank line', () => {
    const html =
      '<p>Royals win.</p>' +
      '<p><br></p><p><br></p><p><br></p><p><br></p><p><br></p>' +
      '<p>Mark homered.</p>';

    expect(collapseHtmlBlankLines(html)).toBe('<p>Royals win.</p><p><br></p><p>Mark homered.</p>');
  });

  it('collapses a mixed run of empty block types to one blank line', () => {
    const html =
      '<p>First.</p>' + '<p></p><p>&nbsp;</p><div><br></div><p><br /></p>' + '<p>Second.</p>';

    expect(collapseHtmlBlankLines(html)).toBe('<p>First.</p><p></p><p>Second.</p>');
  });

  it('collapses consecutive <br> runs (any spelling) to one', () => {
    expect(collapseHtmlBlankLines('Line one<br><br><br>Line two')).toBe('Line one<br>Line two');
    expect(collapseHtmlBlankLines('Line one<br/><br /><br>Line two')).toBe('Line one<br>Line two');
  });

  it('removes leading and trailing empty blocks', () => {
    const html = '<p><br></p><p><br></p><p>Only real line.</p><p><br></p><p><br></p>';
    expect(collapseHtmlBlankLines(html)).toBe('<p>Only real line.</p>');
  });

  it('preserves content paragraphs and inline formatting verbatim', () => {
    const html =
      '<p>Royals win <strong>big</strong>.</p>' +
      '<p><br></p><p><br></p>' +
      '<p><a href="https://example.com">box score</a> and ' +
      '<span style="color: red">notes</span>.</p>';

    expect(collapseHtmlBlankLines(html)).toBe(
      '<p>Royals win <strong>big</strong>.</p>' +
        '<p><br></p>' +
        '<p><a href="https://example.com">box score</a> and ' +
        '<span style="color: red">notes</span>.</p>',
    );
  });

  it('leaves a single blank line untouched (one empty block is allowed)', () => {
    const html = '<p>First.</p><p><br></p><p>Second.</p>';
    expect(collapseHtmlBlankLines(html)).toBe(html);
  });

  it('leaves already-clean content unchanged', () => {
    const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
    expect(collapseHtmlBlankLines(html)).toBe(html);
  });

  it('is idempotent: collapsing twice equals collapsing once', () => {
    const html =
      '<p>Royals win.</p>' +
      '<p><br></p><p><br></p><p><br></p>' +
      '<p>Mark homered.</p>' +
      '<p><br></p><p><br></p>';

    const once = collapseHtmlBlankLines(html);
    expect(collapseHtmlBlankLines(once)).toBe(once);
  });

  it('supports a maxBlankLines of 0 (removes all blank lines)', () => {
    const html = '<p>First.</p><p><br></p><p><br></p><p>Second.</p>';
    expect(collapseHtmlBlankLines(html, 0)).toBe('<p>First.</p><p>Second.</p>');
  });

  it('supports a maxBlankLines of 2', () => {
    const html =
      '<p>First.</p>' + '<p><br></p><p><br></p><p><br></p><p><br></p>' + '<p>Second.</p>';
    expect(collapseHtmlBlankLines(html, 2)).toBe(
      '<p>First.</p><p><br></p><p><br></p><p>Second.</p>',
    );
  });
});

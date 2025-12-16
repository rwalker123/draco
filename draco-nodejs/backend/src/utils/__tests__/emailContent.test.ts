import { describe, expect, it } from 'vitest';

import { htmlToPlainText } from '../emailContent.js';

describe('htmlToPlainText', () => {
  it('preserves paragraph and line breaks', () => {
    const html = `
      <style>.x { color: red }</style>
      <div>
        <p>Hello world</p>
        <p>Second paragraph<br />with a break</p>
      </div>
    `;

    expect(htmlToPlainText(html)).toBe(
      ['Hello world', '', 'Second paragraph', 'with a break'].join('\n'),
    );
  });

  it('decodes common entities and collapses spaces per line', () => {
    const html = '<p>A&nbsp;&amp;&nbsp;B</p><p>   spaced   out   </p>';
    expect(htmlToPlainText(html)).toBe(['A & B', '', 'spaced out'].join('\n'));
  });
});

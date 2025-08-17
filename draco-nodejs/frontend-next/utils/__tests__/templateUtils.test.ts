import {
  insertTemplateVariable,
  normalizeVariableFormat,
  detectExistingVariable,
  extractVariables,
  getAllTemplateVariables,
  validateTemplateContent,
  TEMPLATE_HELPER_TEXT,
} from '../templateUtils';

describe('Template Utils', () => {
  describe('extractVariables', () => {
    it('should extract variables from template content', () => {
      const content = 'Hello {{firstName}}, your team {{teamName}} has a game on {{gameDate}}.';
      const variables = extractVariables(content);
      expect(variables).toEqual(['firstName', 'teamName', 'gameDate']);
    });

    it('should return empty array for content without variables', () => {
      const content = 'Hello there, this has no variables.';
      const variables = extractVariables(content);
      expect(variables).toEqual([]);
    });

    it('should handle malformed variables', () => {
      const content = 'Hello {firstName}, {{teamName}}, {{{invalid}}}';
      const variables = extractVariables(content);
      expect(variables).toEqual(['teamName', 'invalid']);
    });
  });

  describe('normalizeVariableFormat', () => {
    it('should convert single braces to double braces', () => {
      const content = 'Hello {firstName}, your team is {teamName}.';
      const normalized = normalizeVariableFormat(content);
      expect(normalized).toBe('Hello {{firstName}}, your team is {{teamName}}.');
    });

    it('should leave double braces unchanged', () => {
      const content = 'Hello {{firstName}}, your team is {{teamName}}.';
      const normalized = normalizeVariableFormat(content);
      expect(normalized).toBe('Hello {{firstName}}, your team is {{teamName}}.');
    });

    it('should handle mixed formats', () => {
      const content = 'Hello {firstName}, your team {{teamName}} plays at {gameTime}.';
      const normalized = normalizeVariableFormat(content);
      expect(normalized).toBe('Hello {{firstName}}, your team {{teamName}} plays at {{gameTime}}.');
    });
  });

  describe('detectExistingVariable', () => {
    it('should detect single brace variables', () => {
      const content = 'Hello {firstName}, welcome!';
      const result = detectExistingVariable(content, 'firstName');
      expect(result.exists).toBe(true);
      expect(result.singleBraceMatch).toBeDefined();
      expect(result.doubleBraceMatch).toBeUndefined();
    });

    it('should detect double brace variables', () => {
      const content = 'Hello {{firstName}}, welcome!';
      const result = detectExistingVariable(content, 'firstName');
      expect(result.exists).toBe(true);
      expect(result.singleBraceMatch).toBeUndefined();
      expect(result.doubleBraceMatch).toBeDefined();
    });

    it('should return false for non-existent variables', () => {
      const content = 'Hello world!';
      const result = detectExistingVariable(content, 'firstName');
      expect(result.exists).toBe(false);
      expect(result.singleBraceMatch).toBeUndefined();
      expect(result.doubleBraceMatch).toBeUndefined();
    });
  });

  describe('insertTemplateVariable', () => {
    it('should insert new variable at end of content', () => {
      const content = 'Hello there, ';
      const result = insertTemplateVariable(content, 'firstName');
      expect(result.newContent).toBe('Hello there, {{firstName}}');
      expect(result.action).toBe('inserted');
    });

    it('should replace single brace with double brace', () => {
      const content = 'Hello {firstName}, welcome!';
      const result = insertTemplateVariable(content, 'firstName');
      expect(result.newContent).toBe('Hello {{firstName}}, welcome!');
      expect(result.action).toBe('replaced');
      expect(result.message).toContain('Converted {firstName} to {{firstName}}');
    });

    it('should not duplicate existing double brace variables', () => {
      const content = 'Hello {{firstName}}, welcome!';
      const result = insertTemplateVariable(content, 'firstName');
      expect(result.newContent).toBe('Hello {{firstName}}, welcome!');
      expect(result.action).toBe('already_exists');
    });

    it('should insert at specified position', () => {
      const content = 'Hello , welcome!';
      const result = insertTemplateVariable(content, 'firstName', 6);
      expect(result.newContent).toBe('Hello {{firstName}}, welcome!');
      expect(result.action).toBe('inserted');
    });
  });

  describe('getAllTemplateVariables', () => {
    it('should get all unique variables from multiple fields', () => {
      const fields = {
        subject: 'Game reminder for {{teamName}}',
        body: 'Hello {{firstName}}, your team {{teamName}} plays at {{gameTime}}.',
      };
      const variables = getAllTemplateVariables(fields);
      expect(variables.sort()).toEqual(['firstName', 'gameTime', 'teamName']);
    });

    it('should handle empty fields', () => {
      const fields = {
        subject: '',
        body: 'Hello {{firstName}}',
      };
      const variables = getAllTemplateVariables(fields);
      expect(variables).toEqual(['firstName']);
    });
  });

  describe('validateTemplateContent', () => {
    it('should validate correct template content', () => {
      const content = 'Hello {{firstName}}, your team {{teamName}} plays today.';
      const result = validateTemplateContent(content);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect unmatched braces', () => {
      const content = 'Hello {{firstName}, your team {{teamName}} plays today.';
      const result = validateTemplateContent(content);
      expect(result.isValid).toBe(false);
      expect(
        result.issues.some(
          (issue) => issue.type === 'error' && issue.message.includes('Unmatched braces'),
        ),
      ).toBe(true);
    });

    it('should warn about single brace variables', () => {
      const content = 'Hello {firstName}, your team {{teamName}} plays today.';
      const result = validateTemplateContent(content);
      expect(result.isValid).toBe(true); // Warning, not error
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('warning');
    });

    it('should detect empty variables', () => {
      const content = 'Hello {{}}, your team {{teamName}} plays today.';
      const result = validateTemplateContent(content);
      expect(result.isValid).toBe(false);
      expect(
        result.issues.some(
          (issue) => issue.type === 'error' && issue.message.includes('Empty variables'),
        ),
      ).toBe(true);
    });
  });

  describe('TEMPLATE_HELPER_TEXT', () => {
    it('should provide consistent helper text constants', () => {
      expect(TEMPLATE_HELPER_TEXT.SUBJECT).toBe('Use {{variableName}} for dynamic content');
      expect(TEMPLATE_HELPER_TEXT.BODY).toBe(
        'Use {{variableName}} for dynamic content that will be replaced when emails are sent',
      );
      expect(TEMPLATE_HELPER_TEXT.VARIABLE_FORMAT).toBe('{{variableName}}');
    });
  });
});

/**
 * Template utility functions for email template variable handling
 * Provides DRY utilities to prevent code duplication across template components
 */

// Consistent helper text constants
export const TEMPLATE_HELPER_TEXT = {
  SUBJECT: 'Use {{variableName}} for dynamic content',
  BODY: 'Use {{variableName}} for dynamic content that will be replaced when emails are sent',
  VARIABLE_FORMAT: '{{variableName}}',
} as const;

/**
 * Extracts variables from template content
 * @param content - Template content with variables
 * @returns Array of variable names (without braces)
 */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.map((match) => match.replace(/[{}]/g, '').trim()) : [];
}

/**
 * Normalizes variable format from single braces to double braces
 * @param content - Content that may contain single or double brace variables
 * @returns Content with all variables normalized to double braces
 */
export function normalizeVariableFormat(content: string): string {
  // First, temporarily replace double braces to protect them
  const placeholder = '___DOUBLE_BRACE___';
  let result = content.replace(/\{\{([^}]+)\}\}/g, `${placeholder}$1${placeholder}`);

  // Now replace single braces with double braces
  result = result.replace(/\{([^{}]+)\}/g, (match, variableName) => {
    const trimmedVar = variableName.trim();
    if (trimmedVar) {
      return `{{${trimmedVar}}}`;
    }
    return match;
  });

  // Restore the original double braces
  result = result.replace(
    new RegExp(`${placeholder}([^${placeholder}]+)${placeholder}`, 'g'),
    '{{$1}}',
  );

  return result;
}

/**
 * Detects if a variable already exists in content (in any format)
 * @param content - Content to search
 * @param variableName - Variable name to look for
 * @returns Object with existence info and positions
 */
export function detectExistingVariable(
  content: string,
  variableName: string,
): {
  exists: boolean;
  singleBraceMatch?: { start: number; end: number; match: string };
  doubleBraceMatch?: { start: number; end: number; match: string };
} {
  // Escape special regex characters in variable name
  const escapedVarName = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Look for double braces first
  const doublePattern = new RegExp(`\\{\\{${escapedVarName}\\}\\}`, 'g');
  const doubleMatch = doublePattern.exec(content);

  // Look for single braces by temporarily removing double brace variables
  const placeholder = '___TEMP_DOUBLE_BRACE___';
  const contentWithoutDouble = content.replace(/\{\{[^}]+\}\}/g, placeholder);
  const singlePattern = new RegExp(`\\{${escapedVarName}\\}`, 'g');
  const singleMatch = singlePattern.exec(contentWithoutDouble);

  return {
    exists: Boolean(singleMatch || doubleMatch),
    singleBraceMatch: singleMatch
      ? {
          start: singleMatch.index,
          end: singleMatch.index + singleMatch[0].length,
          match: singleMatch[0],
        }
      : undefined,
    doubleBraceMatch: doubleMatch
      ? {
          start: doubleMatch.index,
          end: doubleMatch.index + doubleMatch[0].length,
          match: doubleMatch[0],
        }
      : undefined,
  };
}

/**
 * Smart variable insertion that handles duplicates and format conversion
 * @param content - Current content
 * @param variableName - Variable name to insert (without braces)
 * @param insertPosition - Position to insert (defaults to end)
 * @returns Object with new content and action taken
 */
export function insertTemplateVariable(
  content: string,
  variableName: string,
  insertPosition?: number,
): {
  newContent: string;
  action: 'inserted' | 'replaced' | 'already_exists';
  message?: string;
} {
  const variableTag = `{{${variableName}}}`;
  const existing = detectExistingVariable(content, variableName);

  // If double brace version already exists, don't insert again
  if (existing.doubleBraceMatch) {
    return {
      newContent: content,
      action: 'already_exists',
      message: `Variable {{${variableName}}} already exists`,
    };
  }

  // If single brace version exists, replace it with double brace
  if (existing.singleBraceMatch) {
    const newContent =
      content.substring(0, existing.singleBraceMatch.start) +
      variableTag +
      content.substring(existing.singleBraceMatch.end);
    return {
      newContent,
      action: 'replaced',
      message: `Converted {${variableName}} to {{${variableName}}}`,
    };
  }

  // Insert new variable
  const position = insertPosition ?? content.length;
  const newContent = content.substring(0, position) + variableTag + content.substring(position);

  return {
    newContent,
    action: 'inserted',
    message: `Inserted {{${variableName}}}`,
  };
}

/**
 * Validates template content for common issues
 * @param content - Template content to validate
 * @returns Validation result with any issues found
 */
export function validateTemplateContent(content: string): {
  isValid: boolean;
  issues: Array<{ type: 'warning' | 'error'; message: string }>;
} {
  const issues: Array<{ type: 'warning' | 'error'; message: string }> = [];

  // Check for unmatched braces
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;

  if (openBraces !== closeBraces) {
    issues.push({
      type: 'error',
      message: 'Unmatched braces detected. Check your variable syntax.',
    });
  }

  // Check for single brace variables (exclude those that are part of double braces)
  const placeholder = '___TEMP_DOUBLE_BRACE___';
  const tempContent = content.replace(/\{\{[^}]+\}\}/g, placeholder);
  const singleBraceVars = tempContent.match(/\{[^{}]+\}/g);
  if (singleBraceVars && singleBraceVars.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found single brace variables: ${singleBraceVars.join(', ')}. Consider using double braces for consistency.`,
    });
  }

  // Check for empty variables
  const emptyVars = content.match(/\{\{\s*\}\}/g);
  if (emptyVars && emptyVars.length > 0) {
    issues.push({
      type: 'error',
      message: 'Empty variables found: {{}}. Please provide variable names.',
    });
  }

  return {
    isValid: issues.filter((issue) => issue.type === 'error').length === 0,
    issues,
  };
}

/**
 * Gets all unique variables from multiple template fields
 * @param fields - Object with template field contents
 * @returns Array of unique variable names
 */
export function getAllTemplateVariables(fields: Record<string, string>): string[] {
  const allVariables = Object.values(fields)
    .filter(Boolean)
    .flatMap((content) => extractVariables(content));

  return [...new Set(allVariables)];
}

import { useCallback } from 'react';
import { insertTemplateVariable, validateTemplateContent } from '../utils/templateUtils';

/**
 * Form data interface for template variable insertion
 */
interface TemplateFormData {
  subjectTemplate?: string;
  bodyTemplate?: string;
  [key: string]: unknown;
}

/**
 * Hook for handling template variable insertion with smart duplicate detection
 * Provides consistent variable insertion behavior across template components
 * Supports both string-based and rich text editor insertion
 */
export function useTemplateVariableInsertion() {
  /**
   * Insert a variable into template content with smart handling
   * @param content - Current content
   * @param variable - Variable name to insert (without braces)
   * @param position - Optional position to insert at (defaults to end)
   * @returns Object with new content and action details
   */
  const insertVariable = useCallback((content: string, variable: string, position?: number) => {
    return insertTemplateVariable(content, variable, position);
  }, []);

  /**
   * Create a handler for variable insertion that updates form state
   * @param formData - Current form data
   * @param setFormData - Form data setter function
   * @param targetField - Which field to update ('subject' | 'body')
   * @returns Function to handle variable insertion
   */
  const createVariableInsertHandler = useCallback(
    <T extends TemplateFormData>(
      formData: T,
      setFormData: (updater: (prev: T) => T) => void,
      targetField: 'subject' | 'body' = 'body',
    ) => {
      return (variable: string, fieldOverride?: 'subject' | 'body') => {
        const field = fieldOverride || targetField;
        const contentField = field === 'subject' ? 'subjectTemplate' : 'bodyTemplate';
        const currentContent = formData[contentField] || '';

        const result = insertVariable(currentContent, variable);

        setFormData((prev) => ({
          ...prev,
          [contentField]: result.newContent,
        }));

        // Could emit a toast notification here based on result.action
        if (result.message) {
          console.log(`Variable insertion: ${result.message}`);
        }

        return result;
      };
    },
    [insertVariable],
  );

  /**
   * Create an enhanced handler for rich text editor variable insertion
   * @param editorRef - Reference to the rich text editor
   * @param formData - Current form data
   * @param setFormData - Form data setter function
   * @returns Function to handle variable insertion in rich text editor
   */
  const createRichTextVariableInsertHandler = useCallback(
    <T extends TemplateFormData>(
      editorRef: React.RefObject<{
        getCurrentContent: () => string;
        insertText: (text: string) => void;
        insertVariable: (variable: string) => void;
      }>,
      formData: T,
      setFormData: (updater: (prev: T) => T) => void,
    ) => {
      return (variable: string, field: 'subject' | 'body' = 'body') => {
        if (field === 'subject') {
          // Use string-based insertion for subject
          const subjectHandler = createVariableInsertHandler(formData, setFormData, 'subject');
          return subjectHandler(variable, 'subject');
        } else {
          // Use rich text editor for body
          if (editorRef.current) {
            editorRef.current.insertVariable(variable);

            // Sync form data after insertion
            setTimeout(() => {
              if (editorRef.current) {
                const currentContent = editorRef.current.getCurrentContent();
                setFormData((prev) => ({
                  ...prev,
                  bodyTemplate: currentContent,
                }));
              }
            }, 0);
          }
        }
      };
    },
    [createVariableInsertHandler],
  );

  /**
   * Create validation handler for template content
   * @param content - Content to validate
   * @returns Validation result
   */
  const validateContent = useCallback((content: string) => {
    return validateTemplateContent(content);
  }, []);

  return {
    insertVariable,
    createVariableInsertHandler,
    createRichTextVariableInsertHandler,
    validateContent,
  };
}

export default useTemplateVariableInsertion;

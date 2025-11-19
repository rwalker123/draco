'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import type { PlayerSurveyCategoryType, PlayerSurveyQuestionType } from '@draco/shared-schemas';
import type { Client } from '@draco/shared-api-client/generated/client';
import {
  createPlayerSurveyCategory,
  createPlayerSurveyQuestion,
  deletePlayerSurveyCategory,
  deletePlayerSurveyQuestion,
  updatePlayerSurveyCategory,
  updatePlayerSurveyQuestion,
} from '@draco/shared-api-client';
import WidgetShell from '@/components/ui/WidgetShell';
import { unwrapApiResult } from '@/utils/apiResult';

export const sortCategories = (items: PlayerSurveyCategoryType[]) =>
  [...items].sort((a, b) => {
    if (a.priority === b.priority) {
      return a.categoryName.localeCompare(b.categoryName);
    }
    return a.priority - b.priority;
  });

const sortQuestions = (items: PlayerSurveyQuestionType[]) =>
  [...items].sort((a, b) => {
    if (a.questionNumber === b.questionNumber) {
      return a.question.localeCompare(b.question);
    }
    return a.questionNumber - b.questionNumber;
  });

interface SurveyCategoryManagerProps {
  accountId: string;
  apiClient: Client;
  categories: PlayerSurveyCategoryType[];
  loading: boolean;
  error: string | null;
  onCategoriesChange: (
    updater: (prev: PlayerSurveyCategoryType[]) => PlayerSurveyCategoryType[],
  ) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SurveyCategoryManager: React.FC<SurveyCategoryManagerProps> = ({
  accountId,
  apiClient,
  categories,
  loading,
  error,
  onCategoriesChange,
  onSuccess,
  onError,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPriority, setNewCategoryPriority] = useState<string>('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categorySavingIds, setCategorySavingIds] = useState<Record<string, boolean>>({});
  const [categoryDeletingId, setCategoryDeletingId] = useState<string | null>(null);
  const [questionSavingIds, setQuestionSavingIds] = useState<Record<string, boolean>>({});
  const [questionAddingCategoryId, setQuestionAddingCategoryId] = useState<string | null>(null);
  const [questionDeletingId, setQuestionDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<PlayerSurveyCategoryType | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{
    categoryId: string;
    question: PlayerSurveyQuestionType;
  } | null>(null);
  const [questionDrafts, setQuestionDrafts] = useState<
    Record<string, { question: string; questionNumber: string }>
  >({});

  useEffect(() => {
    const drafts: Record<string, { question: string; questionNumber: string }> = {};
    categories.forEach((category) => {
      drafts[category.id] = { question: '', questionNumber: '' };
    });
    setQuestionDrafts(drafts);
  }, [categories]);

  const handleCreateCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();
    const priorityValue = newCategoryPriority.trim();
    const parsedPriority = priorityValue ? Number(priorityValue) : categories.length + 1;

    if (!trimmedName) {
      onError('Category name is required.');
      return;
    }

    if (Number.isNaN(parsedPriority)) {
      onError('Category priority must be a valid number.');
      return;
    }

    setCreatingCategory(true);

    try {
      const response = await createPlayerSurveyCategory({
        client: apiClient,
        path: { accountId },
        body: {
          categoryName: trimmedName,
          priority: parsedPriority,
        },
        throwOnError: false,
      });

      const created = unwrapApiResult(response, 'Failed to create category');
      if (!created) {
        throw new Error('Failed to create category');
      }

      const normalized = {
        ...created,
        questions: created.questions ?? [],
      };

      onCategoriesChange((prev) => sortCategories([...prev, normalized]));
      setNewCategoryName('');
      setNewCategoryPriority('');
      onSuccess('Category created.');
    } catch (err) {
      console.error('Failed to create category', err);
      onError('Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  }, [
    accountId,
    apiClient,
    categories.length,
    newCategoryName,
    newCategoryPriority,
    onCategoriesChange,
    onError,
    onSuccess,
  ]);

  const handleSaveCategory = useCallback(
    async (categoryId: string, updates: { categoryName?: string; priority?: number }) => {
      setCategorySavingIds((prev) => ({ ...prev, [categoryId]: true }));

      try {
        const response = await updatePlayerSurveyCategory({
          client: apiClient,
          path: { accountId, categoryId },
          body: updates,
          throwOnError: false,
        });

        const updated = unwrapApiResult(response, 'Failed to update category');
        if (!updated) {
          throw new Error('Failed to update category');
        }

        const normalized = {
          ...updated,
          questions: updated.questions ?? [],
        };

        onCategoriesChange((prev) =>
          prev.map((category) => (category.id === categoryId ? normalized : category)),
        );
        onSuccess('Category updated.');
      } catch (err) {
        console.error('Failed to update category', err);
        onError('Failed to update category.');
      } finally {
        setCategorySavingIds((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [accountId, apiClient, onCategoriesChange, onError, onSuccess],
  );

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      setCategoryDeletingId(categoryId);

      try {
        await deletePlayerSurveyCategory({
          client: apiClient,
          path: { accountId, categoryId },
        });

        onCategoriesChange((prev) => prev.filter((category) => category.id !== categoryId));
        onSuccess('Category deleted.');
      } catch (err) {
        console.error('Failed to delete category', err);
        onError('Failed to delete category.');
      } finally {
        setCategoryDeletingId(null);
        setCategoryToDelete(null);
      }
    },
    [accountId, apiClient, onCategoriesChange, onError, onSuccess],
  );

  const handleCreateQuestion = useCallback(
    async (categoryId: string) => {
      const draft = questionDrafts[categoryId] ?? { question: '', questionNumber: '' };
      const trimmedQuestion = draft.question.trim();
      const questionNumberValue = draft.questionNumber.trim();
      const parsedNumber = questionNumberValue ? Number(questionNumberValue) : undefined;

      if (!trimmedQuestion) {
        onError('Question text is required.');
        return;
      }

      if (parsedNumber !== undefined && Number.isNaN(parsedNumber)) {
        onError('Question number must be a valid number.');
        return;
      }

      setQuestionAddingCategoryId(categoryId);

      try {
        const response = await createPlayerSurveyQuestion({
          client: apiClient,
          path: { accountId, categoryId },
          body: {
            categoryId,
            question: trimmedQuestion,
            questionNumber:
              parsedNumber ??
              (categories.find((c) => c.id === categoryId)?.questions ?? []).length + 1,
          },
          throwOnError: false,
        });

        const created = unwrapApiResult(response, 'Failed to create question');
        if (!created) {
          throw new Error('Failed to create question');
        }

        onCategoriesChange((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  questions: sortQuestions([...(category.questions ?? []), created]),
                }
              : category,
          ),
        );
        setQuestionDrafts((prev) => ({
          ...prev,
          [categoryId]: { question: '', questionNumber: '' },
        }));
        onSuccess('Question created.');
      } catch (err) {
        console.error('Failed to create question', err);
        onError('Failed to create question.');
      } finally {
        setQuestionAddingCategoryId(null);
      }
    },
    [accountId, apiClient, categories, questionDrafts, onCategoriesChange, onError, onSuccess],
  );

  const handleUpdateQuestion = useCallback(
    async (questionId: string, updates: { question?: string; questionNumber?: number }) => {
      setQuestionSavingIds((prev) => ({ ...prev, [questionId]: true }));

      try {
        const response = await updatePlayerSurveyQuestion({
          client: apiClient,
          path: { accountId, questionId },
          body: updates,
          throwOnError: false,
        });

        const updated = unwrapApiResult(response, 'Failed to update question');
        if (!updated) {
          throw new Error('Failed to update question');
        }

        onCategoriesChange((prev) =>
          prev.map((category) =>
            category.id === updated.categoryId
              ? {
                  ...category,
                  questions: sortQuestions(
                    (category.questions ?? []).map((question) =>
                      question.id === updated.id ? updated : question,
                    ),
                  ),
                }
              : category,
          ),
        );
        onSuccess('Question updated.');
      } catch (err) {
        console.error('Failed to update question', err);
        onError('Failed to update question.');
      } finally {
        setQuestionSavingIds((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [accountId, apiClient, onCategoriesChange, onError, onSuccess],
  );

  const handleDeleteQuestion = useCallback(
    async (categoryId: string, questionId: string) => {
      setQuestionDeletingId(questionId);

      try {
        await deletePlayerSurveyQuestion({
          client: apiClient,
          path: { accountId, questionId },
        });

        onCategoriesChange((prev) =>
          prev.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  questions: (category.questions ?? []).filter(
                    (question) => question.id !== questionId,
                  ),
                }
              : category,
          ),
        );
        onSuccess('Question deleted.');
      } catch (err) {
        console.error('Failed to delete question', err);
        onError('Failed to delete question.');
      } finally {
        setQuestionDeletingId(null);
        setQuestionToDelete(null);
      }
    },
    [accountId, apiClient, onCategoriesChange, onError, onSuccess],
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateCategory();
          }}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}
        >
          <TextField
            label="Category name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Priority"
            type="number"
            value={newCategoryPriority}
            onChange={(event) => setNewCategoryPriority(event.target.value)}
            size="small"
            sx={{ width: 120 }}
          />
          <Tooltip title={creatingCategory ? 'Adding category' : 'Add category'}>
            <span>
              <IconButton
                type="submit"
                color="primary"
                aria-label="Add category"
                disabled={creatingCategory}
              >
                {creatingCategory ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>No categories yet. Create the first one to get started.</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {categories.map((category) => (
              <CategoryCard
                key={`${category.id}-${category.categoryName}-${category.priority}`}
                category={category}
                drafts={questionDrafts[category.id] ?? { question: '', questionNumber: '' }}
                onDraftChange={(draft) =>
                  setQuestionDrafts((prev) => ({ ...prev, [category.id]: draft }))
                }
                onSaveCategory={handleSaveCategory}
                savingCategory={Boolean(categorySavingIds[category.id])}
                onRequestDeleteCategory={() => setCategoryToDelete(category)}
                deletingCategory={categoryDeletingId === category.id}
                onAddQuestion={() => handleCreateQuestion(category.id)}
                addingQuestion={questionAddingCategoryId === category.id}
                onSaveQuestion={handleUpdateQuestion}
                questionSavingIds={questionSavingIds}
                onRequestDeleteQuestion={(question) =>
                  setQuestionToDelete({ categoryId: category.id, question })
                }
                questionDeletingId={questionDeletingId}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        aria-labelledby="delete-category-dialog-title"
      >
        <DialogTitle id="delete-category-dialog-title">Delete category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deleting a category will remove all questions and player answers associated with it.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => categoryToDelete && void handleDeleteCategory(categoryToDelete.id)}
            disabled={categoryDeletingId === categoryToDelete?.id}
          >
            {categoryDeletingId === categoryToDelete?.id ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(questionToDelete)}
        onClose={() => setQuestionToDelete(null)}
        aria-labelledby="delete-question-dialog-title"
      >
        <DialogTitle id="delete-question-dialog-title">Delete question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove the question and all related player answers. Are you sure you want to
            continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() =>
              questionToDelete &&
              void handleDeleteQuestion(questionToDelete.categoryId, questionToDelete.question.id)
            }
            disabled={questionDeletingId === questionToDelete?.question.id}
          >
            {questionDeletingId === questionToDelete?.question.id ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

interface CategoryCardProps {
  category: PlayerSurveyCategoryType;
  drafts: { question: string; questionNumber: string };
  onDraftChange: (draft: { question: string; questionNumber: string }) => void;
  onSaveCategory: (
    categoryId: string,
    updates: { categoryName?: string; priority?: number },
  ) => Promise<void>;
  savingCategory: boolean;
  onRequestDeleteCategory: () => void;
  deletingCategory: boolean;
  onAddQuestion: () => void;
  addingQuestion: boolean;
  onSaveQuestion: (
    questionId: string,
    updates: { question?: string; questionNumber?: number },
  ) => Promise<void>;
  questionSavingIds: Record<string, boolean>;
  onRequestDeleteQuestion: (question: PlayerSurveyQuestionType) => void;
  questionDeletingId: string | null;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  drafts,
  onDraftChange,
  onSaveCategory,
  savingCategory,
  onRequestDeleteCategory,
  deletingCategory,
  onAddQuestion,
  addingQuestion,
  onSaveQuestion,
  questionSavingIds,
  onRequestDeleteQuestion,
  questionDeletingId,
}) => {
  const [name, setName] = useState(category.categoryName);
  const [priority, setPriority] = useState<string>(String(category.priority));
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    const parsedPriority = Number(priority);

    if (!trimmedName) {
      return;
    }

    if (Number.isNaN(parsedPriority)) {
      return;
    }

    setIsDirty(false);
    return onSaveCategory(category.id, {
      categoryName: trimmedName,
      priority: parsedPriority,
    });
  }, [category.id, name, priority, onSaveCategory]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Category name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setIsDirty(true);
            }}
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            label="Priority"
            type="number"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              setIsDirty(true);
            }}
            size="small"
            sx={{ width: 120 }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={savingCategory ? 'Saving category' : 'Save category'}>
              <span>
                <IconButton
                  color="primary"
                  aria-label="Save category"
                  onClick={() => void handleSave()}
                  disabled={savingCategory || !isDirty || !name.trim()}
                >
                  {savingCategory ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete category">
              <span>
                <IconButton
                  aria-label="Delete category"
                  onClick={onRequestDeleteCategory}
                  disabled={deletingCategory}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={1.5}>
          {category.questions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No questions yet. Add one below.
            </Typography>
          ) : (
            category.questions.map((question) => (
              <QuestionRow
                key={`${question.id}-${question.question}-${question.questionNumber}`}
                question={question}
                onSave={onSaveQuestion}
                saving={Boolean(questionSavingIds[question.id])}
                onDelete={() => onRequestDeleteQuestion(question)}
                deleting={questionDeletingId === question.id}
              />
            ))
          )}
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void onAddQuestion();
          }}
        >
          <TextField
            label="New question"
            value={drafts.question}
            onChange={(event) => onDraftChange({ ...drafts, question: event.target.value })}
            fullWidth
            size="small"
          />
          <TextField
            label="Question number"
            type="number"
            value={drafts.questionNumber}
            onChange={(event) => onDraftChange({ ...drafts, questionNumber: event.target.value })}
            size="small"
            sx={{ width: { xs: '100%', sm: 160 } }}
          />
          <Tooltip title={addingQuestion ? 'Adding question' : 'Add question'}>
            <span>
              <IconButton
                type="submit"
                color="primary"
                aria-label="Add question"
                disabled={addingQuestion}
              >
                {addingQuestion ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

interface QuestionRowProps {
  question: PlayerSurveyQuestionType;
  onSave: (
    questionId: string,
    updates: { question?: string; questionNumber?: number },
  ) => Promise<void>;
  saving: boolean;
  onDelete: () => void;
  deleting: boolean;
}

const QuestionRow: React.FC<QuestionRowProps> = ({
  question,
  onSave,
  saving,
  onDelete,
  deleting,
}) => {
  const [label, setLabel] = useState(question.question);
  const [numberValue, setNumberValue] = useState<string>(String(question.questionNumber));
  const [dirty, setDirty] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = label.trim();
    const parsedNumber = Number(numberValue);

    if (!trimmed || Number.isNaN(parsedNumber)) {
      return;
    }

    setDirty(false);
    return onSave(question.id, {
      question: trimmed,
      questionNumber: parsedNumber,
    });
  }, [label, numberValue, onSave, question.id]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
        <TextField
          label="Question"
          value={label}
          onChange={(event) => {
            setLabel(event.target.value);
            setDirty(true);
          }}
          fullWidth
          size="small"
        />
        <TextField
          label="Number"
          type="number"
          value={numberValue}
          onChange={(event) => {
            setNumberValue(event.target.value);
            setDirty(true);
          }}
          size="small"
          sx={{ width: 120 }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={saving ? 'Saving question' : 'Save question'}>
            <span>
              <IconButton
                color="primary"
                aria-label="Save question"
                onClick={() => void handleSave()}
                disabled={saving || !dirty || !label.trim()}
              >
                {saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete question">
            <span>
              <IconButton
                aria-label="Delete question"
                onClick={onDelete}
                disabled={deleting}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

export type SurveyStructureWidgetProps = SurveyCategoryManagerProps;

const SurveyStructureWidget: React.FC<SurveyStructureWidgetProps> = (props) => (
  <WidgetShell
    title="Survey Structure"
    subtitle="Organize categories and questions for your account."
    accent="secondary"
  >
    <SurveyCategoryManager {...props} />
  </WidgetShell>
);

export default SurveyStructureWidget;

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Tab,
  Tabs,
  Pagination,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { PlayerSurveyCategoryType, PlayerSurveyQuestionType } from '@draco/shared-schemas';
import {
  createPlayerSurveyCategory,
  createPlayerSurveyQuestion,
  deletePlayerSurveyCategory,
  deletePlayerSurveyQuestion,
  listPlayerSurveyCategories,
  updatePlayerSurveyCategory,
  updatePlayerSurveyQuestion,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { useApiClient } from '../../../../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import SurveyPlayerSearchPanel from './SurveyPlayerSearchPanel';
import { getAnswerKey, useSurveyResponses } from './useSurveyResponses';

interface SurveyManagementPageProps {
  accountId: string;
}

const sortCategories = (items: PlayerSurveyCategoryType[]) =>
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

const SurveyManagementPage: React.FC<SurveyManagementPageProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const [categories, setCategories] = useState<PlayerSurveyCategoryType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const hasFetchedCategoriesRef = React.useRef(false);
  const [responsesInitialized, setResponsesInitialized] = useState(false);

  const handleSuccess = useCallback((message: string) => {
    setGlobalSuccess(message);
    setGlobalError(null);
  }, []);

  const handleError = useCallback((message: string) => {
    setGlobalError(message);
    setGlobalSuccess(null);
  }, []);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const response = await listPlayerSurveyCategories({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const data = unwrapApiResult(response, 'Failed to load survey categories');
      const normalized = data?.map((category) => ({
        ...category,
        questions: category.questions ?? [],
      }));
      setCategories(normalized ? sortCategories(normalized) : []);
    } catch (error) {
      console.error('Failed to load survey categories', error);
      setCategoriesError('Failed to load survey categories.');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    if (hasFetchedCategoriesRef.current) {
      return;
    }
    hasFetchedCategoriesRef.current = true;
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    hasFetchedCategoriesRef.current = false;
  }, [accountId]);

  useEffect(() => {
    if (activeTab === 1 && !responsesInitialized) {
      setResponsesInitialized(true);
    }
  }, [activeTab, responsesInitialized]);

  const handleCategoriesChange = useCallback(
    (updater: (prev: PlayerSurveyCategoryType[]) => PlayerSurveyCategoryType[]) => {
      setCategories((prev) => sortCategories(updater(prev)));
    },
    [],
  );

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
            Player Survey Management
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 1, maxWidth: 620, mx: 'auto', color: 'rgba(255,255,255,0.85)' }}
          >
            Create categories and questions for your player surveys, and review or edit player
            responses from one workspace.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          {globalError && <Alert severity="error">{globalError}</Alert>}
          {globalSuccess && <Alert severity="success">{globalSuccess}</Alert>}

          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => setActiveTab(newValue)}
            aria-label="Survey management tabs"
          >
            <Tab
              label="Survey Structure"
              id="survey-structure-tab"
              aria-controls="survey-structure-panel"
            />
            <Tab
              label="Player Responses"
              id="survey-responses-tab"
              aria-controls="survey-responses-panel"
            />
          </Tabs>

          <Box
            role="tabpanel"
            id="survey-structure-panel"
            aria-labelledby="survey-structure-tab"
            hidden={activeTab !== 0}
          >
            {activeTab === 0 && (
              <SurveyCategoryManager
                accountId={accountId}
                apiClient={apiClient}
                categories={categories}
                loading={categoriesLoading}
                error={categoriesError}
                onCategoriesChange={handleCategoriesChange}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </Box>

          <Box
            role="tabpanel"
            id="survey-responses-panel"
            aria-labelledby="survey-responses-tab"
            hidden={activeTab !== 1}
            sx={{ display: activeTab === 1 ? 'block' : 'none' }}
          >
            {responsesInitialized && (
              <SurveyPlayerResponsesManager
                accountId={accountId}
                apiClient={apiClient}
                categories={categories}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
          </Box>
        </Stack>
      </Box>
    </main>
  );
};

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Survey Structure
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the categories and questions your players will answer.
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

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
                key={category.id}
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

  useEffect(() => {
    setName(category.categoryName);
    setPriority(String(category.priority));
    setIsDirty(false);
  }, [category.categoryName, category.priority]);

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
                key={question.id}
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

  useEffect(() => {
    setLabel(question.question);
    setNumberValue(String(question.questionNumber));
    setDirty(false);
  }, [question.question, question.questionNumber]);

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

interface SurveyPlayerResponsesManagerProps {
  accountId: string;
  apiClient: Client;
  categories: PlayerSurveyCategoryType[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SurveyPlayerResponsesManager: React.FC<SurveyPlayerResponsesManagerProps> = ({
  accountId,
  apiClient,
  categories,
  onSuccess,
  onError,
}) => {
  const {
    playerSummaries,
    pagination,
    loading,
    error,
    page,
    selectedContact,
    selectedContactMessage,
    answerDrafts,
    pendingKeys,
    expandedPlayerIds,
    playerDetails,
    playerDetailLoading,
    playerDetailErrors,
    handleContactSelected,
    handleRefresh,
    handleDraftChange,
    handleSaveAnswer,
    handleDeleteAnswer,
    handleAccordionToggle,
    handlePageChange,
  } = useSurveyResponses({
    accountId,
    apiClient,
    onSuccess,
    onError,
  });

  const totalPages = useMemo(() => {
    if (!pagination) {
      return 1;
    }
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const summaryItems = useMemo(
    () =>
      playerSummaries.map((summary) => {
        const playerId = summary.player.id;
        const detail = playerDetails[playerId];
        const detailIsLoading = playerDetailLoading[playerId];
        const detailError = playerDetailErrors[playerId];
        const isExpanded = expandedPlayerIds.includes(playerId);

        if (detail && detail.answers.length === 0) {
          return null;
        }

        return (
          <Accordion
            key={playerId}
            disableGutters
            expanded={isExpanded}
            onChange={handleAccordionToggle(playerId)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 600 }}>
                  {summary.player.firstName} {summary.player.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.hasResponses
                    ? `${summary.answeredQuestionCount} ${
                        summary.answeredQuestionCount === 1 ? 'response' : 'responses'
                      }`
                    : 'No responses yet'}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {detailIsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : detailError ? (
                <Alert severity="error">{detailError}</Alert>
              ) : !detail ? (
                <Typography variant="body2" color="text.secondary">
                  Expand to load the player survey.
                </Typography>
              ) : detail.answers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  This player has not submitted survey answers yet.
                </Typography>
              ) : categories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No survey structure defined yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {categories.map((category) => {
                    const answersByQuestion = new Map(
                      detail.answers.map((answer) => [answer.questionId, answer]),
                    );

                    return (
                      <Box key={`${playerId}-${category.id}`}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {category.categoryName}
                        </Typography>
                        {category.questions.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No questions in this category.
                          </Typography>
                        ) : (
                          <Stack spacing={1.5} sx={{ mt: 1 }}>
                            {category.questions.map((question) => {
                              const key = getAnswerKey(playerId, question.id);
                              const draftValue = answerDrafts[key] ?? '';
                              const answer = answersByQuestion.get(question.id);
                              const isPending = Boolean(pendingKeys[key]);

                              return (
                                <Paper
                                  key={question.id}
                                  variant="outlined"
                                  sx={{ p: 1.5, borderColor: answer ? 'primary.main' : undefined }}
                                >
                                  <Stack spacing={1}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {question.question}
                                    </Typography>
                                    <TextField
                                      label="Answer"
                                      value={draftValue}
                                      onChange={(event) =>
                                        handleDraftChange(key, event.target.value)
                                      }
                                      multiline
                                      minRows={2}
                                      size="small"
                                      disabled={isPending}
                                    />
                                    <Stack direction="row" spacing={1}>
                                      <Tooltip title={isPending ? 'Saving answer' : 'Save answer'}>
                                        <span>
                                          <IconButton
                                            color="primary"
                                            aria-label="Save answer"
                                            onClick={() => void handleSaveAnswer(detail, question)}
                                            disabled={isPending || !draftValue.trim()}
                                          >
                                            {isPending ? (
                                              <CircularProgress size={20} color="inherit" />
                                            ) : (
                                              <SaveIcon />
                                            )}
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip
                                        title={isPending ? 'Clearing answer' : 'Clear answer'}
                                      >
                                        <span>
                                          <IconButton
                                            color="error"
                                            aria-label="Clear answer"
                                            onClick={() =>
                                              void handleDeleteAnswer(detail, question)
                                            }
                                            disabled={isPending || !answer}
                                          >
                                            {isPending ? (
                                              <CircularProgress size={20} color="inherit" />
                                            ) : (
                                              <DeleteIcon />
                                            )}
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Stack>
                                  </Stack>
                                </Paper>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>
        );
      }),
    [
      answerDrafts,
      categories,
      expandedPlayerIds,
      handleAccordionToggle,
      handleDeleteAnswer,
      handleDraftChange,
      handleSaveAnswer,
      pendingKeys,
      playerDetailErrors,
      playerDetailLoading,
      playerDetails,
      playerSummaries,
    ],
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Player Responses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and update survey answers submitted by rostered players.
          </Typography>
        </Box>
        <Tooltip title="Refresh responses">
          <span>
            <IconButton onClick={() => void handleRefresh()} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <SurveyPlayerSearchPanel
        accountId={accountId}
        apiClient={apiClient}
        selectedContact={selectedContact}
        onContactSelected={(contact) => {
          void handleContactSelected(contact);
        }}
        disabled={loading}
      />

      {selectedContactMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectedContactMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : playerSummaries.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography>No player survey responses yet.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>{summaryItems}</Stack>
      )}

      {selectedContact === null && pagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination page={page} count={totalPages} onChange={handlePageChange} color="primary" />
        </Box>
      )}
    </Paper>
  );
};

export default SurveyManagementPage;

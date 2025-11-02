'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import SurveyPlayerSearchPanel from './common/SurveyPlayerSearchPanel';
import { getAnswerKey, useSurveyResponses } from './common/useSurveyResponses';
import type { ContactOption } from './common/surveyResponseTypes';
import type { PlayerSurveyCategoryType } from '@draco/shared-schemas';
import { listPlayerSurveyCategories } from '@draco/shared-api-client';
import { unwrapApiResult } from '@/utils/apiResult';

interface SurveyAccountPageProps {
  accountId: string;
}

const SurveyAccountPage: React.FC<SurveyAccountPageProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const { user } = useAuth();
  const { hasRole } = useRole();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<PlayerSurveyCategoryType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const viewerContact = useMemo<ContactOption | null>(() => {
    if (!user?.contact?.id) {
      return null;
    }

    return {
      id: String(user.contact.id),
      firstName: user.contact.firstName ?? '',
      lastName: user.contact.lastName ?? '',
      photoUrl: user.contact.photoUrl ?? undefined,
    };
  }, [
    user?.contact?.firstName,
    user?.contact?.id,
    user?.contact?.lastName,
    user?.contact?.photoUrl,
  ]);

  const viewerContactId = viewerContact?.id ?? null;
  const isAccountAdmin = Boolean(user && hasRole('AccountAdmin', { accountId: String(accountId) }));

  const handleSuccess = (message: string) => {
    setGlobalSuccess(message);
    setGlobalError(null);
  };

  const handleError = (message: string) => {
    setGlobalError(message);
    setGlobalSuccess(null);
  };

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const result = await listPlayerSurveyCategories({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (!isMounted) {
          return;
        }

        const data = unwrapApiResult(result, 'Failed to load survey categories');
        const normalized =
          data?.map((category) => ({
            ...category,
            questions: category.questions ?? [],
          })) ?? [];
        setCategories(normalized);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load survey categories', error);
        setCategories([]);
        setCategoriesError('Failed to load survey structure.');
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient]);

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
    handleDraftChange,
    handleSaveAnswer,
    handleDeleteAnswer,
    handleAccordionToggle,
    handlePageChange,
  } = useSurveyResponses({
    accountId,
    apiClient,
    onSuccess: handleSuccess,
    onError: handleError,
    viewerContact,
    viewerHasFullAccess: isAccountAdmin,
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
        const canEdit = viewerContactId === playerId || isAccountAdmin;

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
              ) : categoriesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : detailError ? (
                <Alert severity="error">{detailError}</Alert>
              ) : !detail ? (
                <Typography variant="body2" color="text.secondary">
                  Expand to load the player survey.
                </Typography>
              ) : categories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No survey structure defined yet.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {detail.answers.length === 0 &&
                    (canEdit ? (
                      <Alert severity="info">
                        You have not completed your survey yet. Share your answers below when
                        you&apos;re ready.
                      </Alert>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        This player has not submitted survey answers yet.
                      </Typography>
                    ))}
                  {categories.map((category) => {
                    const answersByQuestion = new Map(
                      detail.answers.map((answer) => [answer.questionId, answer]),
                    );
                    return (
                      <Box key={`${playerId}-${category.id}`}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {category.categoryName}
                        </Typography>
                        {category.questions.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No questions in this category.
                          </Typography>
                        ) : (
                          <Stack spacing={1.5}>
                            {category.questions.map((question) => {
                              const key = getAnswerKey(playerId, question.id);
                              const answer = answersByQuestion.get(question.id);
                              const draftValue = answerDrafts[key] ?? answer?.answer ?? '';
                              const isPending = Boolean(pendingKeys[key]);

                              return (
                                <Paper key={question.id} variant="outlined" sx={{ p: 1.5 }}>
                                  <Stack spacing={1}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {question.question}
                                    </Typography>
                                    {canEdit ? (
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
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        {answer?.answer ?? 'No response yet.'}
                                      </Typography>
                                    )}
                                    {canEdit && (
                                      <Stack direction="row" spacing={1}>
                                        <Tooltip
                                          title={isPending ? 'Saving answer' : 'Save answer'}
                                        >
                                          <span>
                                            <IconButton
                                              color="primary"
                                              aria-label="Save answer"
                                              onClick={() =>
                                                void handleSaveAnswer(detail, question)
                                              }
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
                                              disabled={isPending || !answer?.answer}
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
                                    )}
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
      categoriesLoading,
      expandedPlayerIds,
      handleAccordionToggle,
      handleDeleteAnswer,
      handleDraftChange,
      handleSaveAnswer,
      isAccountAdmin,
      pendingKeys,
      playerDetailErrors,
      playerDetailLoading,
      playerDetails,
      playerSummaries,
      viewerContactId,
    ],
  );

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
            Player Surveys
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 1, maxWidth: 620, mx: 'auto', color: 'rgba(255,255,255,0.85)' }}
          >
            Browse survey responses from current-season players. Log in as a rostered player to
            update your answers.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          {globalError && <Alert severity="error">{globalError}</Alert>}
          {globalSuccess && <Alert severity="success">{globalSuccess}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Player Responses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Search by player to filter responses or browse the full list.
            </Typography>

            {categoriesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {categoriesError}
              </Alert>
            )}

            <SurveyPlayerSearchPanel
              accountId={accountId}
              apiClient={apiClient}
              selectedContact={selectedContact}
              onContactSelected={handleContactSelected}
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

            <Divider sx={{ mb: 2 }} />

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
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Stack>
      </Box>
    </main>
  );
};

export default SurveyAccountPage;

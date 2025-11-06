'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
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
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import WidgetShell from '../../../../components/ui/WidgetShell';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useAuth } from '../../../../context/AuthContext';
import { useRole } from '../../../../context/RoleContext';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';
import SurveyPlayerSearchPanel from './common/SurveyPlayerSearchPanel';
import { getAnswerKey, useSurveyResponses } from './common/useSurveyResponses';
import type { ContactOption } from './common/surveyResponseTypes';
import type { PlayerSurveyCategoryType, PlayerSurveyDetailType } from '@draco/shared-schemas';
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

  const isAccountAdmin = Boolean(user && hasRole('AccountAdmin', { accountId: String(accountId) }));
  const { isMember } = useAccountMembership(accountId);
  const isAccountMember = isMember === true;
  const canEditOwnSurvey = Boolean(isAccountMember && viewerContact);
  const [viewerAccordionExpanded, setViewerAccordionExpanded] = useState(false);

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
    fetchPlayerDetail,
  } = useSurveyResponses({
    accountId,
    apiClient,
    onSuccess: handleSuccess,
    onError: handleError,
    viewerContact,
    viewerHasFullAccess: isAccountAdmin,
    disableViewerAutoSelect: !canEditOwnSurvey,
  });

  const viewerPlayerId = viewerContact?.id ?? null;
  const viewerDetail = viewerPlayerId ? playerDetails[viewerPlayerId] : undefined;
  const viewerDetailIsLoading = viewerPlayerId ? playerDetailLoading[viewerPlayerId] : false;
  const viewerDetailError = viewerPlayerId ? playerDetailErrors[viewerPlayerId] : null;
  const viewerSurveyUnavailable = Boolean(
    viewerDetailError && viewerDetailError.toLowerCase().includes('not available'),
  );

  const viewerSurveyForEdit = useMemo(() => {
    if (!viewerPlayerId || !viewerContact) {
      return null;
    }
    if (viewerDetail) {
      return viewerDetail;
    }
    return {
      player: {
        id: viewerPlayerId,
        firstName: viewerContact.firstName ?? '',
        lastName: viewerContact.lastName ?? '',
        photoUrl: viewerContact.photoUrl,
      },
      answers: [],
    } as PlayerSurveyDetailType;
  }, [viewerContact, viewerDetail, viewerPlayerId]);

  useEffect(() => {
    if (!viewerAccordionExpanded) {
      return;
    }
    if (!canEditOwnSurvey || !viewerPlayerId) {
      return;
    }
    if (viewerDetail || viewerDetailIsLoading || viewerDetailError) {
      return;
    }
    fetchPlayerDetail(viewerPlayerId);
  }, [
    canEditOwnSurvey,
    viewerAccordionExpanded,
    viewerPlayerId,
    viewerDetail,
    viewerDetailError,
    viewerDetailIsLoading,
    fetchPlayerDetail,
  ]);

  const listSummaries = useMemo(() => {
    if (selectedContact) {
      return playerSummaries;
    }
    if (canEditOwnSurvey && viewerPlayerId) {
      return playerSummaries.filter((summary) => summary.player.id !== viewerPlayerId);
    }
    return playerSummaries;
  }, [canEditOwnSurvey, playerSummaries, selectedContact, viewerPlayerId]);

  const totalPages = useMemo(() => {
    if (!pagination) {
      return 1;
    }
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const summaryItems = useMemo(
    () =>
      listSummaries.map((summary) => {
        const playerId = summary.player.id;
        const detail = playerDetails[playerId];
        const detailIsLoading = playerDetailLoading[playerId];
        const detailError = playerDetailErrors[playerId];
        const isExpanded = expandedPlayerIds.includes(playerId);

        return (
          <Accordion
            key={playerId}
            disableGutters
            expanded={isExpanded}
            onChange={handleAccordionToggle(playerId)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={summary.player.photoUrl}
                  alt={`${summary.player.firstName} ${summary.player.lastName}`}
                  sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                >
                  {summary.player.firstName?.[0]}
                </Avatar>
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
                  {detail.answers.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      This player has not submitted survey answers yet.
                    </Typography>
                  )}
                  {categories.map((category) => {
                    const answersByQuestion = new Map(
                      detail.answers.map((answer) => [answer.questionId, answer]),
                    );

                    const answeredQuestions = category.questions.filter((question) => {
                      const answer = answersByQuestion.get(question.id);
                      return Boolean(answer?.answer?.trim());
                    });

                    if (answeredQuestions.length === 0) {
                      return null;
                    }

                    return (
                      <Box key={`${playerId}-${category.id}`}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {category.categoryName}
                        </Typography>
                        <Stack spacing={1.5}>
                          {answeredQuestions.map((question) => {
                            const answer = answersByQuestion.get(question.id);
                            const answerText = answer?.answer?.trim() ?? '';

                            return (
                              <Paper key={question.id} variant="outlined" sx={{ p: 1.5 }}>
                                <Stack spacing={1}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {question.question}
                                  </Typography>
                                  <Box
                                    sx={(theme) => ({
                                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                      borderRadius: 1,
                                      px: 1.5,
                                      py: 1,
                                      color: theme.palette.text.primary,
                                    })}
                                  >
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontWeight: 500,
                                        whiteSpace: 'pre-wrap',
                                      }}
                                    >
                                      {answerText}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
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
      categories,
      categoriesLoading,
      expandedPlayerIds,
      handleAccordionToggle,
      playerDetailErrors,
      playerDetailLoading,
      playerDetails,
      listSummaries,
    ],
  );

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box
          sx={(theme) => ({
            textAlign: 'center',
            color: theme.palette.widget.headerText,
          })}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'inherit' }}>
            Player Surveys
          </Typography>
          <Typography
            variant="body1"
            sx={(theme) => ({
              mt: 1,
              maxWidth: 620,
              mx: 'auto',
              color: theme.palette.widget.supportingText,
            })}
          >
            Browse survey responses from current-season players.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          {globalError && <Alert severity="error">{globalError}</Alert>}
          {globalSuccess && <Alert severity="success">{globalSuccess}</Alert>}

          <WidgetShell
            accent="info"
            title="Player Responses"
            subtitle="Search by player to filter responses or browse the full list."
          >
            {categoriesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {categoriesError}
              </Alert>
            )}

            {canEditOwnSurvey && viewerPlayerId && (
              <Box
                sx={(theme) => ({
                  mb: 3,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                  p: 2,
                })}
              >
                <Typography
                  variant="h6"
                  sx={(theme) => ({
                    fontWeight: 600,
                    color: theme.palette.widget.headerText,
                  })}
                >
                  Your Survey
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Only you can see and update this survey entry.
                </Typography>

                <Accordion
                  disableGutters
                  expanded={viewerAccordionExpanded}
                  onChange={(_event, expanded) => {
                    setViewerAccordionExpanded(expanded);
                    if (expanded && !viewerDetail && !viewerDetailIsLoading) {
                      fetchPlayerDetail(viewerPlayerId);
                    }
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={viewerContact?.photoUrl}
                        alt={`${viewerContact?.firstName} ${viewerContact?.lastName}`}
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                      >
                        {viewerContact?.firstName?.[0]}
                      </Avatar>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {viewerContact?.firstName} {viewerContact?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {viewerDetail && viewerDetail.answers.length > 0
                            ? `${viewerDetail.answers.length} ${
                                viewerDetail.answers.length === 1 ? 'response' : 'responses'
                              }`
                            : 'No responses yet'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {categoriesLoading || viewerDetailIsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : viewerDetailError && !viewerSurveyUnavailable && !viewerSurveyForEdit ? (
                      <Alert severity="error">{viewerDetailError}</Alert>
                    ) : !viewerSurveyForEdit ? (
                      <Typography variant="body2" color="text.secondary">
                        Expand to load your survey responses.
                      </Typography>
                    ) : categories.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No survey structure defined yet.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {viewerSurveyUnavailable && (
                          <Alert severity="info">
                            A survey has not been created for you yet. Use the fields below to add
                            your responses.
                          </Alert>
                        )}
                        {viewerSurveyForEdit.answers.length === 0 && !viewerSurveyUnavailable && (
                          <Alert severity="info">
                            You have not completed your survey yet. Use the fields below to add your
                            answers.
                          </Alert>
                        )}
                        {categories.map((category) => {
                          const questions = category.questions ?? [];
                          const answersByQuestion = new Map(
                            viewerSurveyForEdit.answers.map((answer) => [
                              answer.questionId,
                              answer,
                            ]),
                          );

                          if (questions.length === 0) {
                            return (
                              <Box key={`${viewerPlayerId}-${category.id}`}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {category.categoryName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  No questions in this category.
                                </Typography>
                              </Box>
                            );
                          }

                          return (
                            <Box key={`${viewerPlayerId}-${category.id}`}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                {category.categoryName}
                              </Typography>
                              <Stack spacing={1.5}>
                                {questions.map((question) => {
                                  const key = getAnswerKey(viewerPlayerId, question.id);
                                  const answer = answersByQuestion.get(question.id);
                                  const draftValue = answerDrafts[key] ?? answer?.answer ?? '';
                                  const isPending = Boolean(pendingKeys[key]);

                                  return (
                                    <Paper key={question.id} variant="outlined" sx={{ p: 1.5 }}>
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
                                          minRows={3}
                                          size="small"
                                          disabled={isPending}
                                        />
                                        <Stack direction="row" spacing={1}>
                                          <Tooltip
                                            title={isPending ? 'Saving answer' : 'Save answer'}
                                          >
                                            <span>
                                              <IconButton
                                                color="primary"
                                                aria-label="Save answer"
                                                onClick={() =>
                                                  viewerSurveyForEdit &&
                                                  void handleSaveAnswer(
                                                    viewerSurveyForEdit,
                                                    question,
                                                  )
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
                                                  viewerSurveyForEdit &&
                                                  void handleDeleteAnswer(
                                                    viewerSurveyForEdit,
                                                    question,
                                                  )
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
                                      </Stack>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
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
            ) : listSummaries.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>
                  {selectedContact
                    ? 'No survey responses available for this player yet.'
                    : 'No other player survey responses yet.'}
                </Typography>
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
          </WidgetShell>
        </Stack>
      </Box>
    </main>
  );
};

export default SurveyAccountPage;

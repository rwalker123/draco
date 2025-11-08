'use client';

import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Tooltip,
  TextField,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { PlayerSurveyCategoryType } from '@draco/shared-schemas';
import type { Client } from '@draco/shared-api-client/generated/client';
import WidgetShell from '@/components/ui/WidgetShell';
import SurveyPlayerSearchPanel from '../common/SurveyPlayerSearchPanel';
import { getAnswerKey, useSurveyResponses } from '../common/useSurveyResponses';

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

export type SurveyResponsesWidgetProps = SurveyPlayerResponsesManagerProps;

const SurveyResponsesWidget: React.FC<SurveyResponsesWidgetProps> = (props) => (
  <WidgetShell
    title="Player Responses"
    subtitle="Review answers and manage outreach."
    accent="info"
  >
    <SurveyPlayerResponsesManager {...props} />
  </WidgetShell>
);

export default SurveyResponsesWidget;

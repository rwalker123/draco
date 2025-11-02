import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PlayerSurveyDetailType,
  PlayerSurveyQuestionType,
  PlayerSurveySummaryType,
} from '@draco/shared-schemas';
import {
  deletePlayerSurveyAnswer,
  getPlayerSurvey,
  listPlayerSurveys,
  upsertPlayerSurveyAnswer,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { unwrapApiResult } from '@/utils/apiResult';
import { ContactOption, formatContactName } from './surveyResponseTypes';

export const getAnswerKey = (playerId: string, questionId: string) => `${playerId}-${questionId}`;

interface UseSurveyResponsesArgs {
  accountId: string;
  apiClient: Client;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const useSurveyResponses = ({
  accountId,
  apiClient,
  onSuccess,
  onError,
}: UseSurveyResponsesArgs) => {
  const [playerSummaries, setPlayerSummaries] = useState<PlayerSurveySummaryType[]>([]);
  const [playerDetails, setPlayerDetails] = useState<Record<string, PlayerSurveyDetailType>>({});
  const [playerDetailLoading, setPlayerDetailLoading] = useState<Record<string, boolean>>({});
  const [playerDetailErrors, setPlayerDetailErrors] = useState<Record<string, string | null>>({});
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [pendingKeys, setPendingKeys] = useState<Record<string, boolean>>({});
  const [selectedContact, setSelectedContact] = useState<ContactOption | null>(null);
  const [selectedContactMessage, setSelectedContactMessage] = useState<string | null>(null);
  const [expandedPlayerIds, setExpandedPlayerIds] = useState<string[]>([]);
  const pageRef = useRef<number>(1);
  const [page, setPage] = useState<number>(1);

  const resetDetailState = useCallback(() => {
    setPlayerDetails({});
    setPlayerDetailLoading({});
    setPlayerDetailErrors({});
    setAnswerDrafts({});
    setPendingKeys({});
    setExpandedPlayerIds([]);
  }, []);

  const updateDraftsFromDetail = useCallback((detail: PlayerSurveyDetailType) => {
    setAnswerDrafts((prev) => {
      const next = { ...prev };
      detail.answers.forEach((answer) => {
        next[getAnswerKey(detail.player.id, answer.questionId)] = answer.answer;
      });
      return next;
    });
  }, []);

  const loadPlayers = useCallback(
    async (pageArg?: number) => {
      const targetPage = pageArg ?? pageRef.current ?? 1;
      setLoading(true);
      setError(null);
      setSelectedContactMessage(null);
      resetDetailState();

      try {
        const response = await listPlayerSurveys({
          client: apiClient,
          path: { accountId },
          query: {
            page: targetPage,
            pageSize: 20,
          },
          throwOnError: false,
        });

        const data = unwrapApiResult(response, 'Failed to load player surveys');
        const summaries = data?.surveys ?? [];
        setPlayerSummaries(summaries);

        if (data) {
          const paginationMeta: PaginationState = {
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total ?? data.pagination.limit * data.pagination.page,
          };
          setPagination(paginationMeta);
          pageRef.current = paginationMeta.page;
          setPage(paginationMeta.page);
        } else {
          const fallback: PaginationState = { page: targetPage, limit: 20, total: 0 };
          setPagination(fallback);
          pageRef.current = targetPage;
          setPage(targetPage);
        }
      } catch (err) {
        console.error('Failed to load player surveys', err);
        setError('Failed to load player surveys.');
        setPlayerSummaries([]);
        const fallback: PaginationState = { page: targetPage, limit: 20, total: 0 };
        setPagination(fallback);
        pageRef.current = targetPage;
        setPage(targetPage);
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, resetDetailState],
  );

  const fetchPlayerDetail = useCallback(
    async (playerId: string) => {
      if (playerDetails[playerId] || playerDetailLoading[playerId]) {
        return;
      }

      setPlayerDetailLoading((prev) => ({ ...prev, [playerId]: true }));
      setPlayerDetailErrors((prev) => ({ ...prev, [playerId]: null }));

      try {
        const result = await getPlayerSurvey({
          client: apiClient,
          path: { accountId, playerId },
          throwOnError: false,
        });

        if (result.error) {
          const status = result.response?.status;
          const message = result.error.message ?? 'Failed to load player survey.';
          if (status === 404 && /survey not available/i.test(message)) {
            setPlayerDetailErrors((prev) => ({
              ...prev,
              [playerId]: 'Survey not available for this player.',
            }));
            return;
          }
          throw new Error(message);
        }

        const detail = result.data;
        if (!detail) {
          throw new Error('Failed to load player survey.');
        }

        setPlayerDetails((prev) => ({ ...prev, [playerId]: detail }));
        updateDraftsFromDetail(detail);

        if (selectedContact && selectedContact.id === playerId) {
          setSelectedContactMessage(
            detail.answers.length === 0
              ? `${formatContactName(selectedContact)} has not completed the survey yet.`
              : null,
          );
        }
      } catch (err) {
        console.error('Failed to load player survey', err);
        const message = err instanceof Error ? err.message : 'Failed to load player survey.';
        setPlayerDetailErrors((prev) => ({ ...prev, [playerId]: message }));
      } finally {
        setPlayerDetailLoading((prev) => ({ ...prev, [playerId]: false }));
      }
    },
    [
      accountId,
      apiClient,
      playerDetailLoading,
      playerDetails,
      selectedContact,
      updateDraftsFromDetail,
    ],
  );

  const loadSurveyForContact = useCallback(
    async (contact: ContactOption) => {
      setLoading(true);
      setError(null);
      setSelectedContactMessage(null);
      resetDetailState();
      try {
        const result = await getPlayerSurvey({
          client: apiClient,
          path: { accountId, playerId: contact.id },
          throwOnError: false,
        });

        if (result.error) {
          const status = result.response?.status;
          const message = result.error.message ?? 'Failed to load player survey.';
          if (status === 404 && /survey not available/i.test(message)) {
            setSelectedContactMessage('Survey not available for this player.');
            setError(null);
            setPlayerSummaries([]);
            setPagination(null);
            resetDetailState();
            return;
          }

          throw new Error(message);
        }

        const survey = result.data;
        if (!survey) {
          throw new Error('Failed to load player survey.');
        }

        if (survey.answers.length === 0) {
          const contactName = formatContactName(contact);
          setSelectedContactMessage(
            contactName
              ? `${contactName} has not completed the survey yet.`
              : 'This player has not completed the survey yet.',
          );
          setPlayerSummaries([]);
          setPagination(null);
          setPlayerDetails({});
          setPlayerDetailLoading({});
          setPlayerDetailErrors({});
          setPendingKeys({});
          setAnswerDrafts({});
          setExpandedPlayerIds([]);
          pageRef.current = 1;
          setPage(1);
          return;
        }

        const summary: PlayerSurveySummaryType = {
          player: survey.player,
          answeredQuestionCount: survey.answers.length,
          hasResponses: survey.answers.length > 0,
        };

        setPlayerSummaries([summary]);
        setPagination(null);
        setPlayerDetails({ [contact.id]: survey });
        setPlayerDetailLoading({ [contact.id]: false });
        setPlayerDetailErrors({});
        setPendingKeys({});
        setAnswerDrafts(() => {
          const drafts: Record<string, string> = {};
          survey.answers.forEach((answer) => {
            drafts[getAnswerKey(survey.player.id, answer.questionId)] = answer.answer;
          });
          return drafts;
        });
        setExpandedPlayerIds([contact.id]);
        pageRef.current = 1;
        setPage(1);
      } catch (err) {
        console.error('Failed to load player survey', err);
        const message = err instanceof Error ? err.message : 'Failed to load player survey.';
        const isUnavailable = message.toLowerCase().includes('survey not available');
        if (isUnavailable) {
          setSelectedContactMessage('Survey not available for this player.');
          setError(null);
        } else {
          setError(message);
          setSelectedContactMessage(null);
        }
        setPlayerSummaries([]);
        setPagination(null);
        resetDetailState();
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, resetDetailState],
  );

  const handleContactSelected = useCallback(
    async (contact: ContactOption | null) => {
      setSelectedContact(contact);
      if (contact) {
        await loadSurveyForContact(contact);
      } else {
        pageRef.current = 1;
        setPage(1);
        await loadPlayers(1);
      }
    },
    [loadPlayers, loadSurveyForContact],
  );

  const handleRefresh = useCallback(async () => {
    if (selectedContact) {
      await loadSurveyForContact(selectedContact);
    } else {
      await loadPlayers(pageRef.current);
    }
  }, [loadPlayers, loadSurveyForContact, selectedContact]);

  const handleDraftChange = useCallback((key: string, value: string) => {
    setAnswerDrafts((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveAnswer = useCallback(
    async (survey: PlayerSurveyDetailType, question: PlayerSurveyQuestionType) => {
      const key = getAnswerKey(survey.player.id, question.id);
      const draft = answerDrafts[key]?.trim() ?? '';

      if (!draft) {
        onError('Answer text is required.');
        return;
      }

      setPendingKeys((prev) => ({ ...prev, [key]: true }));

      try {
        await upsertPlayerSurveyAnswer({
          client: apiClient,
          path: {
            accountId,
            playerId: survey.player.id,
            questionId: question.id,
          },
          body: { answer: draft },
          throwOnError: false,
        });

        onSuccess('Answer saved.');

        if (selectedContact) {
          await loadSurveyForContact(selectedContact);
        } else {
          await loadPlayers(pageRef.current);
          setExpandedPlayerIds([survey.player.id]);
          void fetchPlayerDetail(survey.player.id);
        }
      } catch (err) {
        console.error('Failed to save answer', err);
        onError('Failed to save answer.');
      } finally {
        setPendingKeys((prev) => ({ ...prev, [key]: false }));
      }
    },
    [
      accountId,
      answerDrafts,
      apiClient,
      fetchPlayerDetail,
      loadPlayers,
      loadSurveyForContact,
      onError,
      onSuccess,
      selectedContact,
    ],
  );

  const handleDeleteAnswer = useCallback(
    async (survey: PlayerSurveyDetailType, question: PlayerSurveyQuestionType) => {
      const playerId = survey.player.id;
      const key = getAnswerKey(playerId, question.id);
      setPendingKeys((prev) => ({ ...prev, [key]: true }));
      const remainingAnswers = survey.answers.filter((answer) => answer.questionId !== question.id);

      try {
        await deletePlayerSurveyAnswer({
          client: apiClient,
          path: {
            accountId,
            playerId,
            questionId: question.id,
          },
        });

        let nextAnswerCount = remainingAnswers.length;
        setPlayerDetails((prev) => {
          const current = prev[playerId];
          if (!current) {
            return prev;
          }
          const filteredAnswers = current.answers.filter(
            (answer) => answer.questionId !== question.id,
          );
          nextAnswerCount = filteredAnswers.length;
          const updated: PlayerSurveyDetailType = {
            ...current,
            answers: filteredAnswers,
          };
          return {
            ...prev,
            [playerId]: updated,
          };
        });

        setAnswerDrafts((prev) => ({
          ...prev,
          [key]: '',
        }));

        setPlayerSummaries((prev) =>
          prev.map((summary) =>
            summary.player.id === playerId
              ? {
                  ...summary,
                  answeredQuestionCount: nextAnswerCount,
                  hasResponses: nextAnswerCount > 0,
                }
              : summary,
          ),
        );

        if (selectedContact && selectedContact.id === playerId) {
          const name = `${survey.player.firstName ?? ''} ${survey.player.lastName ?? ''}`.trim();
          const hasRemainingAnswers = nextAnswerCount > 0;
          setSelectedContactMessage(
            hasRemainingAnswers
              ? null
              : name
                ? `${name} has not completed the survey yet.`
                : 'This player has not completed the survey yet.',
          );
        }

        onSuccess('Answer cleared.');
      } catch (err) {
        console.error('Failed to delete answer', err);
        onError('Failed to delete answer.');
      } finally {
        setPendingKeys((prev) => ({ ...prev, [key]: false }));
      }
    },
    [accountId, apiClient, onError, onSuccess, selectedContact],
  );

  const handleAccordionToggle = useCallback(
    (playerId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPlayerIds((prev) => {
        if (isExpanded) {
          return prev.includes(playerId) ? prev : [...prev, playerId];
        }
        return prev.filter((id) => id !== playerId);
      });

      if (isExpanded) {
        void fetchPlayerDetail(playerId);
      }
    },
    [fetchPlayerDetail],
  );

  const handlePageChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      if (selectedContact) {
        setPage(value);
        pageRef.current = value;
        return;
      }
      pageRef.current = value;
      void loadPlayers(value);
    },
    [loadPlayers, selectedContact],
  );

  useEffect(() => {
    void loadPlayers(pageRef.current);
  }, [loadPlayers]);

  const detailState = useMemo(
    () => ({
      playerDetails,
      playerDetailLoading,
      playerDetailErrors,
    }),
    [playerDetailErrors, playerDetailLoading, playerDetails],
  );

  return {
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
    ...detailState,
    handleContactSelected,
    handleRefresh,
    handleDraftChange,
    handleSaveAnswer,
    handleDeleteAnswer,
    handleAccordionToggle,
    handlePageChange,
    fetchPlayerDetail,
  };
};

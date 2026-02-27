import { useEffect, useRef, useState } from 'react';
import type {
  PlayerSurveyDetailType,
  PlayerSurveyQuestionType,
  PlayerSurveySummaryType,
  PlayerSurveyAnswerType,
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
  viewerContact?: ContactOption | null;
  viewerHasFullAccess?: boolean;
  disableViewerAutoSelect?: boolean;
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
  viewerContact,
  viewerHasFullAccess = false,
  disableViewerAutoSelect = false,
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
  const expandedPlayerIdsRef = useRef<string[]>([]);
  const playerDetailsRef = useRef<Record<string, PlayerSurveyDetailType>>({});
  const playerDetailLoadingRef = useRef<Record<string, boolean>>({});
  const viewerSelectionAppliedRef = useRef(false);
  const pageRef = useRef<number>(1);
  const [page, setPage] = useState<number>(1);
  const selectedContactRef = useRef<ContactOption | null>(null);

  useEffect(() => {
    viewerSelectionAppliedRef.current = false;
  }, [viewerContact?.id]);

  const resetDetailState = (options?: { preserveExpanded?: boolean; preserveDrafts?: boolean }) => {
    setPlayerDetails(() => {
      playerDetailsRef.current = {};
      return {};
    });
    setPlayerDetailLoading(() => {
      playerDetailLoadingRef.current = {};
      return {};
    });
    setPlayerDetailErrors({});
    if (!options?.preserveDrafts) {
      setAnswerDrafts({});
    }
    setPendingKeys({});
    if (!options?.preserveExpanded) {
      setExpandedPlayerIds([]);
      expandedPlayerIdsRef.current = [];
    }
  };

  const updateDraftsFromDetail = (detail: PlayerSurveyDetailType) => {
    setAnswerDrafts((prev) => {
      const next = { ...prev };
      detail.answers.forEach((answer) => {
        next[getAnswerKey(detail.player.id, answer.questionId)] = answer.answer;
      });
      return next;
    });
  };

  const fetchPlayerDetail = async (playerId: string) => {
    if (playerDetailsRef.current[playerId] || playerDetailLoadingRef.current[playerId]) {
      return;
    }

    setPlayerDetailLoading((prev) => {
      const next = { ...prev, [playerId]: true };
      playerDetailLoadingRef.current = next;
      return next;
    });
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

      setPlayerDetails((prev) => {
        const next = { ...prev, [playerId]: detail };
        playerDetailsRef.current = next;
        return next;
      });
      updateDraftsFromDetail(detail);

      const currentContact = selectedContactRef.current;
      if (currentContact && currentContact.id === playerId) {
        setSelectedContactMessage(
          detail.answers.length === 0
            ? `${formatContactName(currentContact)} has not completed the survey yet.`
            : null,
        );
      }
    } catch (err) {
      console.error('Failed to load player survey', err);
      const message = err instanceof Error ? err.message : 'Failed to load player survey.';
      setPlayerDetailErrors((prev) => ({ ...prev, [playerId]: message }));
    } finally {
      setPlayerDetailLoading((prev) => {
        const next = { ...prev, [playerId]: false };
        playerDetailLoadingRef.current = next;
        return next;
      });
    }
  };

  const loadPlayers = async (pageArg?: number) => {
    const targetPage = pageArg ?? pageRef.current ?? 1;
    const previouslyExpanded = expandedPlayerIdsRef.current;
    setLoading(true);
    setError(null);
    setSelectedContactMessage(null);
    resetDetailState({ preserveExpanded: true, preserveDrafts: true });

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

      const visiblePlayerIds = new Set(summaries.map((summary) => summary.player.id));
      const nextExpanded = previouslyExpanded.filter((playerId) => visiblePlayerIds.has(playerId));
      setExpandedPlayerIds(nextExpanded);
      expandedPlayerIdsRef.current = nextExpanded;

      if (summaries.length === 0) {
        setAnswerDrafts({});
      } else {
        const prefixes = summaries.map((summary) => `${summary.player.id}-`);
        setAnswerDrafts((prev) => {
          if (!prev || Object.keys(prev).length === 0) {
            return prev;
          }
          const entries = Object.entries(prev).filter(([key]) =>
            prefixes.some((prefix) => key.startsWith(prefix)),
          );
          if (entries.length === Object.keys(prev).length) {
            return prev;
          }
          return Object.fromEntries(entries);
        });
      }

      if (nextExpanded.length > 0) {
        nextExpanded.forEach((playerId) => {
          void fetchPlayerDetail(playerId);
        });
      }

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
      setAnswerDrafts({});
      const fallback: PaginationState = { page: targetPage, limit: 20, total: 0 };
      setPagination(fallback);
      pageRef.current = targetPage;
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveyForContact = async (contact: ContactOption) => {
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
        setPlayerDetails(() => {
          playerDetailsRef.current = {};
          return {};
        });
        setPlayerDetailLoading(() => {
          playerDetailLoadingRef.current = {};
          return {};
        });
        setPlayerDetailErrors({});
        setPendingKeys({});
        setAnswerDrafts({});
        setExpandedPlayerIds([]);
        expandedPlayerIdsRef.current = [];
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
      setPlayerDetails(() => {
        const map = { [contact.id]: survey } as Record<string, PlayerSurveyDetailType>;
        playerDetailsRef.current = map;
        return map;
      });
      setPlayerDetailLoading(() => {
        const map = { [contact.id]: false } as Record<string, boolean>;
        playerDetailLoadingRef.current = map;
        return map;
      });
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
      expandedPlayerIdsRef.current = [contact.id];
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
  };

  const handleContactSelected = async (contact: ContactOption | null) => {
    setSelectedContact(contact);
    selectedContactRef.current = contact;
    if (contact) {
      await loadSurveyForContact(contact);
    } else {
      pageRef.current = 1;
      setPage(1);
      await loadPlayers(1);
    }
  };

  const handleRefresh = async () => {
    const currentContact = selectedContactRef.current;
    if (currentContact) {
      await loadSurveyForContact(currentContact);
    } else {
      await loadPlayers(pageRef.current);
    }
  };

  const handleDraftChange = (key: string, value: string) => {
    setAnswerDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAnswer = async (
    survey: PlayerSurveyDetailType,
    question: PlayerSurveyQuestionType,
  ) => {
    const key = getAnswerKey(survey.player.id, question.id);
    const draft = answerDrafts[key]?.trim() ?? '';

    if (!draft) {
      onError('Answer text is required.');
      return;
    }

    setPendingKeys((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await upsertPlayerSurveyAnswer({
        client: apiClient,
        path: {
          accountId,
          playerId: survey.player.id,
          questionId: question.id,
        },
        body: { answer: draft },
        throwOnError: false,
      });

      if (response.error) {
        throw response.error;
      }

      const updatedAnswer = response.data;

      setAnswerDrafts((prev) => ({
        ...prev,
        [key]: draft,
      }));

      setPlayerDetails((prev) => {
        const existing = prev[survey.player.id] ?? survey;
        const fallbackCategoryName =
          updatedAnswer?.categoryName ??
          existing.answers?.find((item) => item.questionId === question.id)?.categoryName ??
          survey.answers.find((item) => item.questionId === question.id)?.categoryName ??
          '';

        const nextAnswer: PlayerSurveyAnswerType = updatedAnswer
          ? {
              questionId: updatedAnswer.questionId,
              categoryId: updatedAnswer.categoryId,
              categoryName: updatedAnswer.categoryName,
              question: updatedAnswer.question,
              questionNumber: updatedAnswer.questionNumber,
              answer: updatedAnswer.answer,
            }
          : {
              questionId: question.id,
              categoryId: question.categoryId,
              categoryName: fallbackCategoryName,
              question: question.question,
              questionNumber: question.questionNumber,
              answer: draft,
            };

        const answersWithoutCurrent = (existing.answers ?? []).filter(
          (item) => item.questionId !== question.id,
        );
        answersWithoutCurrent.push(nextAnswer);

        const nextDetail: PlayerSurveyDetailType = {
          ...existing,
          answers: answersWithoutCurrent,
        };

        return {
          ...prev,
          [survey.player.id]: nextDetail,
        };
      });

      const existingAnswers = survey.answers ?? [];
      const hadExistingAnswer = existingAnswers.some((item) => item.questionId === question.id);
      const answersCount = hadExistingAnswer ? existingAnswers.length : existingAnswers.length + 1;

      setPlayerSummaries((prev) => {
        let found = false;
        const updated = prev.map((summary) => {
          if (summary.player.id !== survey.player.id) {
            return summary;
          }
          found = true;
          return {
            ...summary,
            answeredQuestionCount: answersCount,
            hasResponses: answersCount > 0,
          };
        });

        if (!found) {
          updated.push({
            player: survey.player,
            answeredQuestionCount: answersCount,
            hasResponses: answersCount > 0,
          });
        }

        return updated;
      });

      const currentContact = selectedContactRef.current;
      if (currentContact && currentContact.id === survey.player.id) {
        setSelectedContactMessage(null);
      }

      onSuccess('Answer saved.');
    } catch (err) {
      console.error('Failed to save answer', err);
      onError('Failed to save answer.');
    } finally {
      setPendingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteAnswer = async (
    survey: PlayerSurveyDetailType,
    question: PlayerSurveyQuestionType,
  ) => {
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
        const next = {
          ...prev,
          [playerId]: updated,
        };
        playerDetailsRef.current = next;
        return next;
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

      const currentContact = selectedContactRef.current;
      if (currentContact && currentContact.id === playerId) {
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
  };

  const handleAccordionToggle =
    (playerId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPlayerIds((prev) => {
        const next = isExpanded
          ? prev.includes(playerId)
            ? prev
            : [...prev, playerId]
          : prev.filter((id) => id !== playerId);
        expandedPlayerIdsRef.current = next;
        return next;
      });

      if (isExpanded) {
        void fetchPlayerDetail(playerId);
      }
    };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    if (selectedContactRef.current) {
      setPage(value);
      pageRef.current = value;
      return;
    }
    pageRef.current = value;
    void loadPlayers(value);
  };

  useEffect(() => {
    if (selectedContactRef.current) {
      return;
    }

    const controller = new AbortController();
    const targetPage = pageRef.current ?? 1;
    const previouslyExpanded = expandedPlayerIdsRef.current;

    setPlayerDetails(() => {
      playerDetailsRef.current = {};
      return {};
    });
    setPlayerDetailLoading(() => {
      playerDetailLoadingRef.current = {};
      return {};
    });
    setPlayerDetailErrors({});
    setPendingKeys({});
    setLoading(true);
    setError(null);
    setSelectedContactMessage(null);

    const run = async () => {
      try {
        const response = await listPlayerSurveys({
          client: apiClient,
          path: { accountId },
          query: { page: targetPage, pageSize: 20 },
          throwOnError: false,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(response, 'Failed to load player surveys');
        const summaries = data?.surveys ?? [];
        setPlayerSummaries(summaries);

        const visiblePlayerIds = new Set(summaries.map((summary) => summary.player.id));
        const nextExpanded = previouslyExpanded.filter((playerId) =>
          visiblePlayerIds.has(playerId),
        );
        setExpandedPlayerIds(nextExpanded);
        expandedPlayerIdsRef.current = nextExpanded;

        if (summaries.length === 0) {
          setAnswerDrafts({});
        } else {
          const prefixes = summaries.map((summary) => `${summary.player.id}-`);
          setAnswerDrafts((prev) => {
            if (!prev || Object.keys(prev).length === 0) {
              return prev;
            }
            const entries = Object.entries(prev).filter(([key]) =>
              prefixes.some((prefix) => key.startsWith(prefix)),
            );
            if (entries.length === Object.keys(prev).length) {
              return prev;
            }
            return Object.fromEntries(entries);
          });
        }

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
        if (controller.signal.aborted) return;
        console.error('Failed to load player surveys', err);
        setError('Failed to load player surveys.');
        setPlayerSummaries([]);
        setAnswerDrafts({});
        const fallback: PaginationState = { page: targetPage, limit: 20, total: 0 };
        setPagination(fallback);
        pageRef.current = targetPage;
        setPage(targetPage);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  useEffect(() => {
    if (!viewerContact || viewerHasFullAccess || disableViewerAutoSelect) {
      return;
    }

    if (viewerSelectionAppliedRef.current) {
      return;
    }

    if (pagination === null) {
      return;
    }

    if (selectedContact && selectedContact.id !== viewerContact.id) {
      return;
    }

    const viewerInSummaries = playerSummaries.some(
      (summary) => summary.player.id === viewerContact.id,
    );

    if (!viewerInSummaries && !selectedContact) {
      viewerSelectionAppliedRef.current = true;

      setSelectedContact(viewerContact);
      selectedContactRef.current = viewerContact;

      const controller = new AbortController();

      setLoading(true);
      setError(null);
      setSelectedContactMessage(null);
      resetDetailState();

      const run = async () => {
        try {
          const result = await getPlayerSurvey({
            client: apiClient,
            path: { accountId, playerId: viewerContact.id },
            throwOnError: false,
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

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
            const contactName = formatContactName(viewerContact);
            setSelectedContactMessage(
              contactName
                ? `${contactName} has not completed the survey yet.`
                : 'This player has not completed the survey yet.',
            );
            setPlayerSummaries([]);
            setPagination(null);
            setPlayerDetails(() => {
              playerDetailsRef.current = {};
              return {};
            });
            setPlayerDetailLoading(() => {
              playerDetailLoadingRef.current = {};
              return {};
            });
            setPlayerDetailErrors({});
            setPendingKeys({});
            setAnswerDrafts({});
            setExpandedPlayerIds([]);
            expandedPlayerIdsRef.current = [];
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
          setPlayerDetails(() => {
            const map = { [viewerContact.id]: survey } as Record<string, PlayerSurveyDetailType>;
            playerDetailsRef.current = map;
            return map;
          });
          setPlayerDetailLoading(() => {
            const map = { [viewerContact.id]: false } as Record<string, boolean>;
            playerDetailLoadingRef.current = map;
            return map;
          });
          setPlayerDetailErrors({});
          setPendingKeys({});
          setAnswerDrafts(() => {
            const drafts: Record<string, string> = {};
            survey.answers.forEach((answer) => {
              drafts[getAnswerKey(survey.player.id, answer.questionId)] = answer.answer;
            });
            return drafts;
          });
          setExpandedPlayerIds([viewerContact.id]);
          expandedPlayerIdsRef.current = [viewerContact.id];
          pageRef.current = 1;
          setPage(1);
        } catch (err) {
          if (controller.signal.aborted) return;
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
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      void run();

      return () => {
        controller.abort();
      };
    }
  }, [
    viewerContact,
    viewerHasFullAccess,
    disableViewerAutoSelect,
    pagination,
    playerSummaries,
    selectedContact,
    accountId,
    apiClient,
  ]);

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
    fetchPlayerDetail,
  };
};

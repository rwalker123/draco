'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Box,
  Stack,
} from '@mui/material';
import { AccountPollType } from '@draco/shared-schemas';
import { listActiveAccountPolls, voteOnAccountPoll } from '@draco/shared-api-client';
import { useAuth } from '../../context/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';

interface AccountPollsCardProps {
  accountId: string;
  isAuthorizedForAccount?: boolean;
}

export const AccountPollsCard: React.FC<AccountPollsCardProps> = ({
  accountId,
  isAuthorizedForAccount,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [polls, setPolls] = useState<AccountPollType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);
  const hasToken = Boolean(token);
  const canViewPolls = useMemo(
    () => hasToken && (isAuthorizedForAccount ?? true),
    [hasToken, isAuthorizedForAccount],
  );

  const cardSx = useMemo(
    () => ({
      alignSelf: 'flex-start',
      width: '100%',
      maxWidth: { xs: '100%', sm: 420 },
    }),
    [],
  );

  const fetchPolls = useCallback(async () => {
    if (!canViewPolls) {
      setPolls([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await listActiveAccountPolls({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const polls = unwrapApiResult(result, 'Failed to load poll list');
      setPolls(polls ?? []);
    } catch (err) {
      console.error('Failed to load polls:', err);
      setError('Failed to load polls.');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, canViewPolls]);

  useEffect(() => {
    void fetchPolls();
  }, [fetchPolls]);

  const handleVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!canViewPolls) return;

      setSubmittingPollId(pollId);
      setError(null);

      try {
        const result = await voteOnAccountPoll({
          client: apiClient,
          path: { accountId, pollId },
          body: { optionId },
          throwOnError: false,
        });
        const updatedPoll = unwrapApiResult(result, 'Failed to submit vote');
        setPolls((prev) => prev.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll)));
      } catch (err) {
        console.error('Failed to submit vote:', err);
        setError('Failed to submit vote.');
      } finally {
        setSubmittingPollId(null);
      }
    },
    [accountId, apiClient, canViewPolls],
  );

  const shouldRenderCard = canViewPolls && (polls.length > 0 || Boolean(error));

  if (!shouldRenderCard) {
    return null;
  }

  return (
    <Card elevation={3} sx={cardSx}>
      <CardHeader title="Polls" subheader="Share your voice with the organization" />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Stack spacing={3}>
            {polls.map((poll) => {
              const totalVotes = poll.totalVotes;
              const selectedOptionId = poll.userVoteOptionId ?? '';
              const isSubmitting = submittingPollId === poll.id;

              return (
                <Box
                  key={poll.id}
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {poll.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {totalVotes === 1 ? '1 vote so far' : `${totalVotes} votes so far`}
                  </Typography>
                  <RadioGroup
                    value={selectedOptionId}
                    onChange={(event) => handleVote(poll.id, event.target.value)}
                  >
                    {poll.options.map((option) => {
                      const voteCount = option.voteCount;
                      const percentage =
                        totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                      return (
                        <Box key={option.id} sx={{ mb: 1.5 }}>
                          <FormControlLabel
                            value={option.id}
                            control={<Radio disabled={isSubmitting} />}
                            label={
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  width: '100%',
                                }}
                              >
                                <Typography sx={{ mr: 2 }}>{option.optionText}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {voteCount} • {percentage}%
                                </Typography>
                              </Box>
                            }
                          />
                          <LinearProgress
                            variant="determinate"
                            value={totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0}
                            sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                          />
                        </Box>
                      );
                    })}
                  </RadioGroup>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountPollsCard;

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

interface AccountPollsCardProps {
  accountId: string;
}

export const AccountPollsCard: React.FC<AccountPollsCardProps> = ({ accountId }) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [polls, setPolls] = useState<AccountPollType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingPollId, setSubmittingPollId] = useState<string | null>(null);

  const canViewPolls = useMemo(() => Boolean(token), [token]);

  const fetchPolls = useCallback(async () => {
    if (!canViewPolls) {
      setPolls([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await listActiveAccountPolls({
        client: apiClient,
        params: { accountId },
        throwOnError: false,
      });

      if (result.error) {
        if (result.error.status === 403) {
          setError('You do not have permission to view polls for this account.');
        } else if (result.error.status === 401) {
          setError('Authentication required to view polls.');
        } else {
          setError('Failed to load polls.');
        }
        setPolls([]);
        return;
      }

      setPolls((result.data as AccountPollType[]) ?? []);
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
          params: { accountId, pollId },
          body: { optionId },
          throwOnError: false,
        });

        if (result.error) {
          if (result.error.status === 404) {
            setError('The poll is no longer available.');
          } else if (result.error.status === 403) {
            setError('You are not allowed to vote on this poll.');
          } else {
            setError('Failed to submit vote.');
          }
          return;
        }

        const updatedPoll = result.data as AccountPollType;
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

  if (!canViewPolls) {
    return (
      <Card elevation={3}>
        <CardHeader title="Polls" />
        <CardContent>
          <Typography color="text.secondary">
            Sign in and join this organization to view and vote in polls.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
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
        ) : polls.length === 0 ? (
          <Typography color="text.secondary">There are no active polls right now.</Typography>
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

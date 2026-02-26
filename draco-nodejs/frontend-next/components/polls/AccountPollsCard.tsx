'use client';

import React, { useEffect, useState } from 'react';
import {
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
import WidgetShell from '../ui/WidgetShell';

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
  const canViewPolls = Boolean(token) && (isAuthorizedForAccount ?? true);

  useEffect(() => {
    if (!canViewPolls) {
      setPolls([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchPolls = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listActiveAccountPolls({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const loaded = unwrapApiResult(result, 'Failed to load poll list');
        setPolls(loaded ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load polls:', err);
        setError('Failed to load polls.');
        setPolls([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchPolls();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, canViewPolls]);

  const handleVote = async (pollId: string, optionId: string) => {
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
  };

  const shouldRenderCard = canViewPolls && (polls.length > 0 || Boolean(error));

  if (!shouldRenderCard) {
    return null;
  }

  return (
    <WidgetShell
      title="Polls"
      subtitle="Share your voice with the organization"
      accent="secondary"
      sx={[
        {
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      ]}
    >
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
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: 'background.paper',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  {poll.question}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {totalVotes === 1 ? '1 vote so far' : `${totalVotes} votes so far`}
                </Typography>
                <RadioGroup
                  value={selectedOptionId}
                  onChange={(event) => void handleVote(poll.id, event.target.value)}
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
    </WidgetShell>
  );
};

export default AccountPollsCard;

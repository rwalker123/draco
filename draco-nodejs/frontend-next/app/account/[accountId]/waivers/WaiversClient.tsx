'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  getTeamRosterWaiverSummaries,
  updateRosterMember,
  type TeamRosterWaiverSummaries,
} from '@draco/shared-api-client';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { useAccountSettings } from '../../../../hooks/useAccountSettings';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { useSeasonLeaguesAndTeams } from './useSeasonLeaguesAndTeams';

interface WaiversClientProps {
  accountId: string;
}

type WaiverMember = TeamRosterWaiverSummaries['members'][number];

export default function WaiversClient({ accountId }: WaiversClientProps) {
  const apiClient = useApiClient();
  const {
    settings: accountSettings,
    loading: settingsLoading,
    error: settingsError,
  } = useAccountSettings(accountId);
  const trackWaiverSetting = accountSettings?.find(
    (setting) => setting.definition.key === 'TrackWaiver',
  );
  const trackWaiverEnabled = Boolean(
    trackWaiverSetting?.effectiveValue ?? trackWaiverSetting?.value,
  );
  const {
    currentSeasonId,
    currentSeasonName,
    loading: seasonLoading,
    error: seasonError,
    fetchCurrentSeason,
  } = useCurrentSeason(accountId);

  useEffect(() => {
    if (accountId) {
      void fetchCurrentSeason().catch(() => undefined);
    }
  }, [accountId, fetchCurrentSeason]);

  const {
    leagues,
    teamsByLeague,
    loading: leaguesLoading,
    error: leaguesError,
  } = useSeasonLeaguesAndTeams(accountId, currentSeasonId);

  const [selectedLeagueSeasonId, setSelectedLeagueSeasonId] = useState<string>('');
  const [selectedTeamSeasonId, setSelectedTeamSeasonId] = useState<string>('');
  const [members, setMembers] = useState<WaiverMember[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [updatingDriversLicenseIds, setUpdatingDriversLicenseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingWaiverIds, setUpdatingWaiverIds] = useState<Set<string>>(() => new Set());
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTeamSeasonId('');
    setMembers([]);
    setRosterError(null);
  }, [selectedLeagueSeasonId, currentSeasonId]);

  useEffect(() => {
    if (!currentSeasonId || !selectedTeamSeasonId) {
      setMembers([]);
      setRosterError(null);
      setRosterLoading(false);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setRosterLoading(true);
      setRosterError(null);
      try {
        const result = await getTeamRosterWaiverSummaries({
          client: apiClient,
          path: {
            accountId,
            seasonId: currentSeasonId,
            teamSeasonId: selectedTeamSeasonId,
          },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load roster');
        setMembers(data.members);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setRosterError(err instanceof Error ? err.message : 'Failed to load roster');
        setMembers([]);
      } finally {
        if (!controller.signal.aborted) {
          setRosterLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [accountId, currentSeasonId, selectedTeamSeasonId, apiClient]);

  const handleToggleDriversLicense = async (member: WaiverMember) => {
    if (!currentSeasonId || !selectedTeamSeasonId) return;
    const rosterMemberId = member.rosterMember.id;
    const nextValue = !member.rosterMember.player.submittedDriversLicense;

    setUpdatingDriversLicenseIds((prev) => {
      const next = new Set(prev);
      next.add(rosterMemberId);
      return next;
    });
    setUpdateError(null);

    try {
      const result = await updateRosterMember({
        client: apiClient,
        path: {
          accountId,
          seasonId: currentSeasonId,
          teamSeasonId: selectedTeamSeasonId,
          rosterMemberId,
        },
        body: { player: { submittedDriversLicense: nextValue } },
        throwOnError: false,
      });

      const updated = unwrapApiResult(result, 'Failed to update submitted drivers license status');

      setMembers((prev) =>
        prev.map((m) => {
          if (m.rosterMember.id !== rosterMemberId) return m;
          return {
            ...m,
            rosterMember: {
              ...m.rosterMember,
              ...updated,
              player: { ...m.rosterMember.player, ...updated.player },
            },
          };
        }),
      );
    } catch (err: unknown) {
      setUpdateError(
        err instanceof Error ? err.message : 'Failed to update submitted drivers license status',
      );
    } finally {
      setUpdatingDriversLicenseIds((prev) => {
        const next = new Set(prev);
        next.delete(rosterMemberId);
        return next;
      });
    }
  };

  const handleToggleWaiver = async (member: WaiverMember) => {
    if (!currentSeasonId || !selectedTeamSeasonId) return;
    const rosterMemberId = member.rosterMember.id;
    const nextValue = !member.rosterMember.submittedWaiver;

    setUpdatingWaiverIds((prev) => {
      const next = new Set(prev);
      next.add(rosterMemberId);
      return next;
    });
    setUpdateError(null);

    try {
      const result = await updateRosterMember({
        client: apiClient,
        path: {
          accountId,
          seasonId: currentSeasonId,
          teamSeasonId: selectedTeamSeasonId,
          rosterMemberId,
        },
        body: { submittedWaiver: nextValue },
        throwOnError: false,
      });

      const updated = unwrapApiResult(result, 'Failed to update waiver status');

      setMembers((prev) =>
        prev.map((m) => {
          if (m.rosterMember.id !== rosterMemberId) return m;
          const newWaiver = updated.submittedWaiver ?? nextValue;
          const updatedSeasonTeams = m.seasonTeams.map((team) =>
            team.teamSeasonId === selectedTeamSeasonId
              ? { ...team, submittedWaiver: newWaiver }
              : team,
          );
          return {
            ...m,
            rosterMember: { ...m.rosterMember, ...updated },
            seasonTeams: updatedSeasonTeams,
          };
        }),
      );
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update waiver status');
    } finally {
      setUpdatingWaiverIds((prev) => {
        const next = new Set(prev);
        next.delete(rosterMemberId);
        return next;
      });
    }
  };

  const teamsForSelectedLeague = selectedLeagueSeasonId
    ? (teamsByLeague.get(selectedLeagueSeasonId) ?? [])
    : [];

  const sortedMembers = [...members].sort((a, b) => {
    const lastA = a.rosterMember.player.contact.lastName ?? '';
    const lastB = b.rosterMember.player.contact.lastName ?? '';
    const lastCompare = lastA.localeCompare(lastB);
    if (lastCompare !== 0) return lastCompare;
    const firstA = a.rosterMember.player.contact.firstName ?? '';
    const firstB = b.rosterMember.player.contact.firstName ?? '';
    return firstA.localeCompare(firstB);
  });

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Player Waivers
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
            {currentSeasonName
              ? `Manage submitted waiver status for ${currentSeasonName}`
              : 'Manage submitted waiver status for the current season'}
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {settingsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : settingsError ? (
          <Alert severity="error">Unable to load account settings: {settingsError}</Alert>
        ) : !trackWaiverEnabled ? (
          <Alert severity="info">
            Player waiver tracking is currently disabled for this account.
          </Alert>
        ) : (
          <>
            {seasonError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {seasonError}
              </Alert>
            )}
            {leaguesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {leaguesError}
              </Alert>
            )}
            {updateError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUpdateError(null)}>
                {updateError}
              </Alert>
            )}

            {seasonLoading && !currentSeasonId ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !currentSeasonId ? (
              <Alert severity="info">There is no current season configured for this account.</Alert>
            ) : (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography component="label" htmlFor="waivers-league-select">
                      League:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }} disabled={leaguesLoading}>
                      <Select
                        id="waivers-league-select"
                        value={selectedLeagueSeasonId}
                        onChange={(e) => setSelectedLeagueSeasonId(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'League' }}
                      >
                        <MenuItem value="">
                          <em>Select a league</em>
                        </MenuItem>
                        {leagues.map((league) => (
                          <MenuItem key={league.leagueSeasonId} value={league.leagueSeasonId}>
                            {league.leagueName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography component="label" htmlFor="waivers-team-select">
                      Team:
                    </Typography>
                    <FormControl
                      size="small"
                      sx={{ minWidth: 220 }}
                      disabled={!selectedLeagueSeasonId || leaguesLoading}
                    >
                      <Select
                        id="waivers-team-select"
                        value={selectedTeamSeasonId}
                        onChange={(e) => setSelectedTeamSeasonId(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Team' }}
                      >
                        <MenuItem value="">
                          <em>Select a team</em>
                        </MenuItem>
                        {teamsForSelectedLeague.map((team) => (
                          <MenuItem key={team.teamSeasonId} value={team.teamSeasonId}>
                            {team.teamName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>

                {selectedTeamSeasonId && (
                  <Paper variant="outlined">
                    {rosterLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                      </Box>
                    ) : rosterError ? (
                      <Box sx={{ p: 3 }}>
                        <Alert severity="error">{rosterError}</Alert>
                      </Box>
                    ) : sortedMembers.length === 0 ? (
                      <Box sx={{ p: 3 }}>
                        <Typography color="text.secondary">No players on this team.</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Player</TableCell>
                              <TableCell align="center" sx={{ width: 220 }}>
                                Submitted Drivers License
                              </TableCell>
                              <TableCell align="center" sx={{ width: 200 }}>
                                Waiver for This Team
                              </TableCell>
                              <TableCell>All Teams Waiver Submitted</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sortedMembers.map((member) => {
                              const rosterMemberId = member.rosterMember.id;
                              const contact = member.rosterMember.player.contact;
                              const fullName =
                                `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() ||
                                'Unknown';
                              const teamsWithWaiver = member.seasonTeams.filter(
                                (team) => team.submittedWaiver,
                              );
                              const isUpdatingDriversLicense =
                                updatingDriversLicenseIds.has(rosterMemberId);
                              const isUpdatingWaiver = updatingWaiverIds.has(rosterMemberId);
                              return (
                                <TableRow key={rosterMemberId} hover>
                                  <TableCell>{fullName}</TableCell>
                                  <TableCell align="center">
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Switch
                                        checked={Boolean(
                                          member.rosterMember.player.submittedDriversLicense,
                                        )}
                                        onChange={() => handleToggleDriversLicense(member)}
                                        disabled={isUpdatingDriversLicense}
                                        inputProps={{
                                          'aria-label': `Toggle submitted drivers license for ${fullName}`,
                                        }}
                                      />
                                      {isUpdatingDriversLicense && <CircularProgress size={16} />}
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <Switch
                                        checked={Boolean(member.rosterMember.submittedWaiver)}
                                        onChange={() => handleToggleWaiver(member)}
                                        disabled={isUpdatingWaiver}
                                        inputProps={{
                                          'aria-label': `Toggle waiver for ${fullName}`,
                                        }}
                                      />
                                      {isUpdatingWaiver && <CircularProgress size={16} />}
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    {teamsWithWaiver.length === 0 ? (
                                      <Typography variant="body2" color="text.secondary">
                                        —
                                      </Typography>
                                    ) : (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {teamsWithWaiver.map((team) => (
                                          <Chip
                                            key={team.teamSeasonId}
                                            size="small"
                                            color={
                                              team.teamSeasonId === selectedTeamSeasonId
                                                ? 'primary'
                                                : 'default'
                                            }
                                            variant={
                                              team.teamSeasonId === selectedTeamSeasonId
                                                ? 'filled'
                                                : 'outlined'
                                            }
                                            label={`${team.leagueName} / ${team.teamName}`}
                                          />
                                        ))}
                                      </Stack>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Paper>
                )}
              </Stack>
            )}
          </>
        )}
      </Container>
    </main>
  );
}

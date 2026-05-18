'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  exportLeagueWaivers,
  exportTeamWaivers,
  getTeamRosterWaiverSummaries,
  updateRosterMember,
} from '@draco/shared-api-client';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { useAccountSettings } from '../../../../hooks/useAccountSettings';
import { useApiClient } from '../../../../hooks/useApiClient';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { downloadBlob } from '../../../../utils/downloadUtils';
import { useLeagueWaiverData, type WaiverMember } from './useLeagueWaiverData';
import { useSeasonLeaguesAndTeams } from './useSeasonLeaguesAndTeams';

interface WaiversClientProps {
  accountId: string;
}

interface MultiRegPlayer {
  contactId: string;
  fullName: string;
  waiverTeams: Array<{ leagueName: string; teamName: string }>;
}

type TeamWaiverDataItem = { teamSeasonId: string; members: WaiverMember[] };

function computeLeagueSummary(data: TeamWaiverDataItem[], leagueSeasonId: string) {
  const seenContactIds = new Set<string>();
  let withWaiver = 0;
  let otherWaiver = 0;
  let noWaiver = 0;

  for (const team of data) {
    for (const member of team.members) {
      const contactId = member.rosterMember.player.contact.id;
      if (seenContactIds.has(contactId)) continue;
      seenContactIds.add(contactId);

      const hasWaiverInLeague = member.seasonTeams.some(
        (t) => t.leagueSeasonId === leagueSeasonId && t.submittedWaiver,
      );
      const hasWaiverAnywhere = member.seasonTeams.some((t) => t.submittedWaiver);

      if (hasWaiverInLeague) {
        withWaiver++;
      } else if (hasWaiverAnywhere) {
        otherWaiver++;
      } else {
        noWaiver++;
      }
    }
  }

  return { withWaiver, otherWaiver, noWaiver, total: seenContactIds.size };
}

function computeTeamSummary(members: WaiverMember[], teamSeasonId: string) {
  let withWaiver = 0;
  let otherWaiver = 0;
  let noWaiver = 0;

  for (const member of members) {
    const hasWaiverOnTeam = member.seasonTeams.some(
      (t) => t.teamSeasonId === teamSeasonId && t.submittedWaiver,
    );
    const hasWaiverAnywhere = member.seasonTeams.some((t) => t.submittedWaiver);

    if (hasWaiverOnTeam) {
      withWaiver++;
    } else if (hasWaiverAnywhere) {
      otherWaiver++;
    } else {
      noWaiver++;
    }
  }

  return { withWaiver, otherWaiver, noWaiver, total: members.length };
}

interface SummaryCardsProps {
  withWaiver: number;
  otherWaiver: number;
  noWaiver: number;
  total: number;
  label: string;
  firstStatLabel: string;
  secondStatLabel: string;
}

function SummaryCards({
  withWaiver,
  otherWaiver,
  noWaiver,
  total,
  label,
  firstStatLabel,
  secondStatLabel,
}: SummaryCardsProps) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" color="success.main" align="center">
              {withWaiver}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {firstStatLabel}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" color="warning.main" align="center">
              {otherWaiver}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {secondStatLabel}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" color="error.main" align="center">
              {noWaiver}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              No Waiver
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" color="text.primary" align="center">
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              Total Players
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

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
  const [updatingDriversLicenseIds, setUpdatingDriversLicenseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [updatingWaiverIds, setUpdatingWaiverIds] = useState<Set<string>>(() => new Set());
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [multiRegOpen, setMultiRegOpen] = useState(false);
  const [multiRegLoading, setMultiRegLoading] = useState(false);
  const [multiRegError, setMultiRegError] = useState<string | null>(null);
  const [multiRegPlayers, setMultiRegPlayers] = useState<MultiRegPlayer[] | null>(null);
  const multiRegControllerRef = useRef<AbortController | null>(null);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const teamsForSelectedLeague = selectedLeagueSeasonId
    ? (teamsByLeague.get(selectedLeagueSeasonId) ?? [])
    : [];

  const {
    teamWaiverData,
    loading: rosterLoading,
    error: rosterError,
  } = useLeagueWaiverData(accountId, currentSeasonId, selectedLeagueSeasonId, teamsByLeague);

  const [localTeamWaiverData, setLocalTeamWaiverData] = useState<TeamWaiverDataItem[]>([]);

  useEffect(() => {
    setLocalTeamWaiverData(teamWaiverData);
  }, [teamWaiverData]);

  useEffect(() => {
    setSelectedTeamSeasonId('');
    setUpdateError(null);
  }, [selectedLeagueSeasonId, currentSeasonId]);

  const displayTeamData = localTeamWaiverData.find((d) => d.teamSeasonId === selectedTeamSeasonId);
  const displayMembers = displayTeamData?.members ?? [];

  const sortedMembers = [...displayMembers].sort((a, b) => {
    const lastA = a.rosterMember.player.contact.lastName ?? '';
    const lastB = b.rosterMember.player.contact.lastName ?? '';
    const lastCompare = lastA.localeCompare(lastB);
    if (lastCompare !== 0) return lastCompare;
    const firstA = a.rosterMember.player.contact.firstName ?? '';
    const firstB = b.rosterMember.player.contact.firstName ?? '';
    return firstA.localeCompare(firstB);
  });

  const leagueSummary = selectedLeagueSeasonId
    ? computeLeagueSummary(localTeamWaiverData, selectedLeagueSeasonId)
    : null;

  const teamSummary =
    selectedTeamSeasonId && selectedLeagueSeasonId
      ? computeTeamSummary(displayMembers, selectedTeamSeasonId)
      : null;

  const handleToggleDriversLicense = async (member: WaiverMember) => {
    if (!currentSeasonId || !selectedTeamSeasonId) return;
    const rosterMemberId = member.rosterMember.id;
    const contactId = member.rosterMember.player.contact.id;
    const nextValue = !member.rosterMember.player.submittedDriversLicense;

    setUpdateError(null);
    setUpdatingDriversLicenseIds((prev) => new Set(prev).add(rosterMemberId));

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
      unwrapApiResult(result, 'Failed to update submitted drivers license status');
      setLocalTeamWaiverData((prev) =>
        prev.map((teamData) => ({
          ...teamData,
          members: teamData.members.map((m) =>
            m.rosterMember.player.contact.id === contactId
              ? {
                  ...m,
                  rosterMember: {
                    ...m.rosterMember,
                    player: { ...m.rosterMember.player, submittedDriversLicense: nextValue },
                  },
                }
              : m,
          ),
        })),
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
    const contactId = member.rosterMember.player.contact.id;
    const teamSeasonId = selectedTeamSeasonId;
    const nextValue = !member.rosterMember.submittedWaiver;

    setUpdateError(null);
    setUpdatingWaiverIds((prev) => new Set(prev).add(rosterMemberId));

    try {
      const result = await updateRosterMember({
        client: apiClient,
        path: {
          accountId,
          seasonId: currentSeasonId,
          teamSeasonId,
          rosterMemberId,
        },
        body: { submittedWaiver: nextValue },
        throwOnError: false,
      });
      unwrapApiResult(result, 'Failed to update waiver status');
      setLocalTeamWaiverData((prev) =>
        prev.map((teamData) => ({
          ...teamData,
          members: teamData.members.map((m) => {
            if (m.rosterMember.player.contact.id !== contactId) return m;
            return {
              ...m,
              rosterMember:
                m.rosterMember.id === rosterMemberId
                  ? { ...m.rosterMember, submittedWaiver: nextValue }
                  : m.rosterMember,
              seasonTeams: m.seasonTeams.map((team) =>
                team.teamSeasonId === teamSeasonId ? { ...team, submittedWaiver: nextValue } : team,
              ),
            };
          }),
        })),
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

  const handleCheckMultipleRegistrations = async () => {
    if (!currentSeasonId) return;

    multiRegControllerRef.current?.abort();
    const controller = new AbortController();
    multiRegControllerRef.current = controller;

    setMultiRegOpen(true);
    setMultiRegLoading(true);
    setMultiRegError(null);
    setMultiRegPlayers(null);

    try {
      const allTeams = Array.from(teamsByLeague.values()).flat();

      const results = await Promise.all(
        allTeams.map((team) =>
          getTeamRosterWaiverSummaries({
            client: apiClient,
            path: {
              accountId,
              seasonId: currentSeasonId,
              teamSeasonId: team.teamSeasonId,
            },
            signal: controller.signal,
            throwOnError: false,
          }),
        ),
      );

      if (controller.signal.aborted) return;

      const contactMap = new Map<
        string,
        { fullName: string; waiverTeams: Array<{ leagueName: string; teamName: string }> }
      >();

      for (const result of results) {
        const teamData = unwrapApiResult(result, 'Failed to load roster');
        for (const member of teamData.members) {
          const contactId = member.rosterMember.player.contact.id;
          const contact = member.rosterMember.player.contact;
          const fullName =
            `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'Unknown';

          const waiverTeams = member.seasonTeams
            .filter((t) => t.submittedWaiver)
            .map((t) => ({ leagueName: t.leagueName, teamName: t.teamName }));

          if (waiverTeams.length >= 2 && !contactMap.has(contactId)) {
            contactMap.set(contactId, { fullName, waiverTeams });
          }
        }
      }

      const flagged: MultiRegPlayer[] = Array.from(contactMap.entries())
        .map(([contactId, data]) => ({
          contactId,
          fullName: data.fullName,
          waiverTeams: data.waiverTeams,
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      setMultiRegPlayers(flagged);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setMultiRegError(err instanceof Error ? err.message : 'Failed to check registrations');
    } finally {
      if (!controller.signal.aborted) {
        setMultiRegLoading(false);
      }
    }
  };

  const handleCloseMultiReg = () => {
    multiRegControllerRef.current?.abort();
    setMultiRegOpen(false);
  };

  const handleExportWaivers = async () => {
    if (!currentSeasonId || !selectedLeagueSeasonId) return;
    setExportLoading(true);
    setExportError(null);
    try {
      if (selectedTeamSeasonId) {
        const selectedTeam = teamsForSelectedLeague.find(
          (t) => t.teamSeasonId === selectedTeamSeasonId,
        );
        const result = await exportTeamWaivers({
          client: apiClient,
          path: {
            accountId,
            seasonId: currentSeasonId,
            teamSeasonId: selectedTeamSeasonId,
          },
          throwOnError: false,
          parseAs: 'blob',
        });
        const blob = unwrapApiResult(result, 'Failed to export waivers') as Blob;
        const teamName = selectedTeam?.teamName ?? 'team';
        const sanitizedName = teamName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        downloadBlob(blob, `${sanitizedName}-waivers.csv`);
      } else {
        const selectedLeague = leagues.find((l) => l.leagueSeasonId === selectedLeagueSeasonId);
        const result = await exportLeagueWaivers({
          client: apiClient,
          path: {
            accountId,
            seasonId: currentSeasonId,
            leagueSeasonId: selectedLeagueSeasonId,
          },
          throwOnError: false,
          parseAs: 'blob',
        });
        const blob = unwrapApiResult(result, 'Failed to export waivers') as Blob;
        const leagueName = selectedLeague?.leagueName ?? 'league';
        const sanitizedName = leagueName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        downloadBlob(blob, `${sanitizedName}-waivers.csv`);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export waivers');
    } finally {
      setExportLoading(false);
    }
  };

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
            {exportError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
                {exportError}
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
                  flexWrap="wrap"
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

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => void handleCheckMultipleRegistrations()}
                    disabled={leaguesLoading || leagues.length === 0}
                  >
                    Check for Multiple Submitted Waivers
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      exportLoading ? <CircularProgress size={16} /> : <FileDownloadIcon />
                    }
                    onClick={() => void handleExportWaivers()}
                    disabled={!selectedLeagueSeasonId || exportLoading}
                  >
                    Export Waivers
                  </Button>
                </Stack>

                {rosterLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : rosterError ? (
                  <Alert severity="error">{rosterError}</Alert>
                ) : (
                  <>
                    {leagueSummary && (
                      <SummaryCards
                        withWaiver={leagueSummary.withWaiver}
                        otherWaiver={leagueSummary.otherWaiver}
                        noWaiver={leagueSummary.noWaiver}
                        total={leagueSummary.total}
                        label="League Waiver Summary"
                        firstStatLabel="Waiver in This League"
                        secondStatLabel="Waiver for Another League"
                      />
                    )}

                    {teamSummary && selectedTeamSeasonId && (
                      <SummaryCards
                        withWaiver={teamSummary.withWaiver}
                        otherWaiver={teamSummary.otherWaiver}
                        noWaiver={teamSummary.noWaiver}
                        total={teamSummary.total}
                        label="Team Waiver Summary"
                        firstStatLabel="Waiver in This Team"
                        secondStatLabel="Waiver for Another Team"
                      />
                    )}

                    {selectedTeamSeasonId && (
                      <Paper variant="outlined">
                        {sortedMembers.length === 0 ? (
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

                                  const waiverOnOtherTeam = member.seasonTeams.some(
                                    (t) =>
                                      t.teamSeasonId !== selectedTeamSeasonId && t.submittedWaiver,
                                  );
                                  const disableWaiverToggle =
                                    waiverOnOtherTeam && !member.rosterMember.submittedWaiver;

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
                                            onChange={() => void handleToggleDriversLicense(member)}
                                            disabled={isUpdatingDriversLicense}
                                            inputProps={{
                                              'aria-label': `Toggle submitted drivers license for ${fullName}`,
                                            }}
                                          />
                                          {isUpdatingDriversLicense && (
                                            <CircularProgress size={16} />
                                          )}
                                        </Stack>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Stack
                                          direction="row"
                                          spacing={1}
                                          alignItems="center"
                                          justifyContent="center"
                                        >
                                          <Tooltip
                                            title={
                                              disableWaiverToggle
                                                ? 'This player already has a waiver on another team'
                                                : ''
                                            }
                                          >
                                            <span>
                                              <Switch
                                                checked={Boolean(
                                                  member.rosterMember.submittedWaiver,
                                                )}
                                                onChange={() => void handleToggleWaiver(member)}
                                                disabled={isUpdatingWaiver || disableWaiverToggle}
                                                inputProps={{
                                                  'aria-label': `Toggle waiver for ${fullName}`,
                                                }}
                                              />
                                            </span>
                                          </Tooltip>
                                          {isUpdatingWaiver && <CircularProgress size={16} />}
                                        </Stack>
                                      </TableCell>
                                      <TableCell>
                                        {teamsWithWaiver.length === 0 ? (
                                          <Typography variant="body2" color="text.secondary">
                                            —
                                          </Typography>
                                        ) : (
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            flexWrap="wrap"
                                            useFlexGap
                                          >
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
                  </>
                )}
              </Stack>
            )}
          </>
        )}
      </Container>

      <Dialog open={multiRegOpen} onClose={handleCloseMultiReg} maxWidth="sm" fullWidth>
        <DialogTitle>
          Multiple Registrations Check
          <IconButton
            aria-label="close"
            onClick={handleCloseMultiReg}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {multiRegLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : multiRegError ? (
            <Alert severity="error">{multiRegError}</Alert>
          ) : multiRegPlayers === null ? null : multiRegPlayers.length === 0 ? (
            <Alert severity="success">No players with multiple registrations found.</Alert>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {multiRegPlayers.length} player{multiRegPlayers.length !== 1 ? 's' : ''} with
                waivers on multiple teams:
              </Typography>
              {multiRegPlayers.map((player) => (
                <Box key={player.contactId}>
                  <Typography variant="subtitle2">{player.fullName}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    {player.waiverTeams.map((wt, idx) => (
                      <Chip
                        key={idx}
                        size="small"
                        color="warning"
                        label={`${wt.leagueName} / ${wt.teamName}`}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

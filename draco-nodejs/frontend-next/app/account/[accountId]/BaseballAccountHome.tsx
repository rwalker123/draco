import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Chip, Typography } from '@mui/material';
import { Group as GroupIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useRole } from '../../../context/RoleContext';
import TodayScoreboard from '../../../components/TodayScoreboard';
import YesterdayScoreboard from '../../../components/YesterdayScoreboard';
import GameRecapsWidget from '../../../components/GameRecapsWidget';
import MyTeams, { UserTeam } from '../../../components/MyTeams';
import AccountPageHeader from '../../../components/AccountPageHeader';
import OrganizationsWidget from '../../../components/OrganizationsWidget';
import { JoinLeagueDashboard } from '../../../components/join-league';
import AccountPollsCard from '../../../components/polls/AccountPollsCard';
import { SponsorService } from '../../../services/sponsorService';
import SponsorCard from '../../../components/sponsors/SponsorCard';
import LeadersWidget from '../../../components/statistics/LeadersWidget';
import { AnnouncementService } from '../../../services/announcementService';
import {
  getAccountById,
  getAccountUserTeams,
  listSeasonLeagueSeasons,
} from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { useAccountMembership } from '../../../hooks/useAccountMembership';
import { unwrapApiResult } from '@/utils/apiResult';
import {
  AccountSeasonWithStatusType,
  AccountType,
  SponsorType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  AnnouncementType,
} from '@draco/shared-schemas';
import TodaysBirthdaysCard from '@/components/birthdays/TodaysBirthdaysCard';
import PendingPhotoSubmissionsPanel from '@/components/photo-submissions/PendingPhotoSubmissionsPanel';
import PhotoSubmissionPanel from '@/components/photo-submissions/PhotoSubmissionPanel';
import type { PhotoAlbumOption } from '@/components/photo-submissions/PhotoSubmissionForm';
import { usePendingPhotoSubmissions } from '../../../hooks/usePendingPhotoSubmissions';
import { usePhotoGallery } from '../../../hooks/usePhotoGallery';
import PhotoGallerySection, {
  type TeamAlbumHierarchyGroup,
} from '@/components/photo-gallery/PhotoGallerySection';
import { mapLeagueSetup } from '../../../utils/leagueSeasonMapper';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import HofNominationWidget from '@/components/hall-of-fame/HofNominationWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import SpecialAnnouncementsWidget, {
  type SpecialAnnouncementCard,
} from '@/components/announcements/SpecialAnnouncementsWidget';
import InformationWidget from '@/components/information/InformationWidget';
import AccountOptional from '@/components/account/AccountOptional';

interface TeamAnnouncementSection {
  teamId: string;
  teamSeasonId?: string | null;
  seasonId?: string | null;
  leagueName?: string;
  teamName: string;
  announcements: AnnouncementType[];
}

const BaseballAccountHome: React.FC = () => {
  const [account, setAccount] = useState<AccountType | null>(null);
  const [currentSeason, setCurrentSeason] = useState<AccountSeasonWithStatusType | null>(null);
  const [userTeams, setUserTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrganizationsWidget, setShowOrganizationsWidget] = useState(false);
  const [accountSponsors, setAccountSponsors] = useState<SponsorType[]>([]);
  const [sponsorError, setSponsorError] = useState<string | null>(null);
  const [accountAnnouncements, setAccountAnnouncements] = useState<AnnouncementType[]>([]);
  const [accountAnnouncementsLoading, setAccountAnnouncementsLoading] = useState(false);
  const [accountAnnouncementsError, setAccountAnnouncementsError] = useState<string | null>(null);
  const [teamAnnouncements, setTeamAnnouncements] = useState<TeamAnnouncementSection[]>([]);
  const [teamAnnouncementsLoading, setTeamAnnouncementsLoading] = useState(false);
  const [teamAnnouncementsError, setTeamAnnouncementsError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const { hasRole, hasRoleInAccount } = useRole();
  const router = useRouter();
  const { accountId } = useParams();
  const accountIdStr = Array.isArray(accountId) ? accountId[0] : accountId;
  const apiClient = useApiClient();
  const announcementService = useMemo(
    () => new AnnouncementService(token, apiClient),
    [token, apiClient],
  );
  const {
    isMember,
    loading: membershipLoading,
    error: membershipError,
  } = useAccountMembership(accountIdStr);
  const isAccountMember = isMember === true;
  const hasAccountContact = Boolean(isAccountMember);
  const canSubmitPhotos = Boolean(isAccountMember);
  const showSubmissionPanel = Boolean(isAccountMember);

  const canModerateAccountPhotos = useMemo(() => {
    if (!accountIdStr) {
      return false;
    }

    return (
      hasRole('Administrator') ||
      hasRole('PhotoAdmin') ||
      hasRoleInAccount('AccountAdmin', accountIdStr) ||
      hasRoleInAccount('AccountPhotoAdmin', accountIdStr)
    );
  }, [accountIdStr, hasRole, hasRoleInAccount]);

  const specialAnnouncements = useMemo<SpecialAnnouncementCard[]>(() => {
    const accountLabel = account?.name ? `${account.name} Announcement` : 'Account Announcement';
    const accountSpecial = accountAnnouncements
      .filter((item) => item.isSpecial)
      .map<SpecialAnnouncementCard>((item) => ({
        id: item.id,
        title: item.title,
        publishedAt: item.publishedAt,
        body: item.body,
        accountId: item.accountId,
        teamId: item.teamId,
        visibility: item.visibility,
        sourceLabel: accountLabel,
      }));

    const teamSpecial = teamAnnouncements.flatMap((section) => {
      const leagueHeading =
        section.leagueName && section.leagueName !== 'Unknown League' ? section.leagueName : null;
      const heading = leagueHeading ? `${leagueHeading} ${section.teamName}` : section.teamName;

      return section.announcements
        .filter((item) => item.isSpecial)
        .map<SpecialAnnouncementCard>((item) => ({
          id: item.id,
          title: item.title,
          publishedAt: item.publishedAt,
          body: item.body,
          accountId: item.accountId,
          teamId: item.teamId,
          visibility: item.visibility,
          sourceLabel: `${section.teamName} Announcement`,
          heading,
        }));
    });

    return [...accountSpecial, ...teamSpecial].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }, [accountAnnouncements, teamAnnouncements, account]);

  const shouldShowPendingPanel = Boolean(token && canModerateAccountPhotos && accountIdStr);

  const showInformationWidget = true;
  const {
    submissions: pendingSubmissions,
    loading: pendingLoading,
    error: pendingError,
    successMessage: pendingSuccess,
    processingIds: pendingProcessingIds,
    approve: approvePendingSubmission,
    deny: denyPendingSubmission,
    refresh: refreshPendingSubmissions,
    clearStatus: clearPendingStatus,
  } = usePendingPhotoSubmissions({
    accountId: accountIdStr ?? null,
    enabled: shouldShowPendingPanel,
  });

  const submissionAlbumOptions: PhotoAlbumOption[] = useMemo(() => {
    const options = new Map<string | null, string>();
    options.set(null, 'Main Account Album (Default)');

    pendingSubmissions.forEach((submission) => {
      const album = submission.album;
      if (album?.id && album.title) {
        options.set(album.id, album.title);
      }
    });

    return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
  }, [pendingSubmissions]);

  const {
    photos: galleryPhotos,
    albums: galleryAlbums,
    loading: galleryLoading,
    error: galleryError,
    refresh: refreshGallery,
  } = usePhotoGallery({ accountId: accountIdStr ?? null });

  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string>('all');
  const [seasonTeamIds, setSeasonTeamIds] = useState<string[] | null>(null);
  const [seasonLeagueHierarchy, setSeasonLeagueHierarchy] = useState<
    LeagueSeasonWithDivisionTeamsAndUnassignedType[]
  >([]);

  const seasonFilteredPhotos = useMemo(() => {
    if (seasonTeamIds === null || seasonTeamIds.length === 0) {
      return galleryPhotos;
    }

    const allowedTeamIds = new Set(seasonTeamIds);
    return galleryPhotos.filter((photo) => {
      if (!photo.teamId) {
        return true;
      }
      return allowedTeamIds.has(photo.teamId);
    });
  }, [galleryPhotos, seasonTeamIds]);

  const seasonFilteredAlbums = useMemo(() => {
    if (seasonTeamIds === null || seasonTeamIds.length === 0) {
      return galleryAlbums;
    }

    const allowedTeamIds = new Set(seasonTeamIds);
    const albumCounts = new Map<string, number>();

    seasonFilteredPhotos.forEach((photo) => {
      const key = photo.albumId ?? 'null';
      albumCounts.set(key, (albumCounts.get(key) ?? 0) + 1);
    });

    const normalizedAlbums = galleryAlbums
      .map((album) => ({
        ...album,
        title: album.accountId === '0' ? 'Default Album' : album.title,
      }))
      .sort((a, b) => {
        const aDefault = a.accountId === '0';
        const bDefault = b.accountId === '0';
        if (aDefault && !bDefault) return -1;
        if (!aDefault && bDefault) return 1;
        return (a.title ?? '').localeCompare(b.title ?? '');
      });

    return normalizedAlbums
      .filter((album) => {
        if (!album.teamId) {
          return true;
        }
        return allowedTeamIds.has(album.teamId);
      })
      .map((album) => {
        const key = album.id ?? 'null';
        const photoCount = albumCounts.get(key) ?? 0;
        return { ...album, photoCount };
      })
      .filter((album) => album.photoCount > 0 || album.id === null);
  }, [galleryAlbums, seasonFilteredPhotos, seasonTeamIds]);

  const teamAlbumsByTeamId = useMemo(() => {
    const map = new Map<
      string,
      { albumId: string; photoCount: number; albumTitle: string | null }
    >();

    seasonFilteredAlbums.forEach((album) => {
      if (album.teamId && album.id) {
        map.set(album.teamId, {
          albumId: album.id,
          photoCount: album.photoCount ?? 0,
          albumTitle: album.title ?? null,
        });
      }
    });

    return map;
  }, [seasonFilteredAlbums]);

  const teamAlbumHierarchy = useMemo<TeamAlbumHierarchyGroup[]>(() => {
    if (seasonLeagueHierarchy.length === 0 || teamAlbumsByTeamId.size === 0) {
      return [];
    }

    const groups: TeamAlbumHierarchyGroup[] = [];

    seasonLeagueHierarchy.forEach((league) => {
      const divisions: TeamAlbumHierarchyGroup['divisions'] = [];

      (league.divisions ?? []).forEach((division) => {
        const teams: TeamAlbumHierarchyGroup['divisions'][number]['teams'] = [];

        division.teams.forEach((team) => {
          const teamId = team.team?.id ?? null;
          if (!teamId) {
            return;
          }

          const album = teamAlbumsByTeamId.get(teamId);
          if (!album) {
            return;
          }

          teams.push({
            teamId,
            teamSeasonId: team.id,
            teamName: team.name ?? team.name ?? 'Team',
            albumId: album.albumId,
            photoCount: album.photoCount,
          });
        });

        if (teams.length > 0) {
          divisions.push({
            id: division.id,
            name: division.division.name,
            teams,
          });
        }
      });

      const unassignedTeams: TeamAlbumHierarchyGroup['unassignedTeams'] = [];

      league.unassignedTeams?.forEach((team) => {
        const teamId = team.team?.id ?? null;
        if (!teamId) {
          return;
        }

        const album = teamAlbumsByTeamId.get(teamId);
        if (!album) {
          return;
        }

        unassignedTeams.push({
          teamId,
          teamSeasonId: team.id,
          teamName: team.name ?? team.name ?? 'Team',
          albumId: album.albumId,
          photoCount: album.photoCount,
        });
      });

      if (divisions.length === 0 && unassignedTeams.length === 0) {
        return;
      }

      groups.push({
        leagueId: league.id,
        leagueName: league.league.name,
        divisions,
        unassignedTeams,
      });
    });

    return groups;
  }, [seasonLeagueHierarchy, teamAlbumsByTeamId]);

  const currentSeasonId = useMemo(() => {
    if (!currentSeason?.id) {
      return null;
    }
    return String(currentSeason.id);
  }, [currentSeason]);

  const leaderLeagues = useMemo(() => {
    if (seasonLeagueHierarchy.length === 0) {
      return [];
    }

    return seasonLeagueHierarchy
      .map((leagueSeason) => {
        const id = leagueSeason.id ? String(leagueSeason.id) : null;
        const name = leagueSeason.league?.name ?? 'League';
        return id ? { id, name } : null;
      })
      .filter(
        (league): league is { id: string; name: string } => league !== null && league.id.length > 0,
      );
  }, [seasonLeagueHierarchy]);

  useEffect(() => {
    if (selectedAlbumKey === 'all') {
      return;
    }

    const hasAlbum = seasonFilteredAlbums.some(
      (album) => (album.id ?? 'null') === selectedAlbumKey,
    );
    if (!hasAlbum) {
      setSelectedAlbumKey('all');
    }
  }, [seasonFilteredAlbums, selectedAlbumKey]);

  const filteredGalleryPhotos = useMemo(() => {
    if (selectedAlbumKey === 'all') {
      return seasonFilteredPhotos;
    }

    if (selectedAlbumKey === 'null') {
      return seasonFilteredPhotos.filter((photo) => photo.albumId === null);
    }

    return seasonFilteredPhotos.filter((photo) => photo.albumId === selectedAlbumKey);
  }, [seasonFilteredPhotos, selectedAlbumKey]);

  const handleAlbumTabChange = useCallback((value: string) => {
    setSelectedAlbumKey(value);
  }, []);

  const handleApprovePendingSubmission = useCallback(
    async (submissionId: string) => {
      const success = await approvePendingSubmission(submissionId);
      if (success) {
        await refreshGallery();
      }
      return success;
    },
    [approvePendingSubmission, refreshGallery],
  );

  const accountDisplayName = account?.name ?? 'this organization';

  // Fetch public account data
  useEffect(() => {
    if (!accountIdStr) {
      setAccount(null);
      setCurrentSeason(null);
      setError('Account ID not found');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAccountData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAccountById({
          client: apiClient,
          path: { accountId: accountIdStr },
          query: { includeCurrentSeason: true },
          throwOnError: false,
        });

        if (!isMounted) {
          return;
        }

        const {
          account: accountData,
          seasons,
          currentSeason: responseCurrentSeason,
        } = unwrapApiResult(result, 'Account not found or not publicly accessible');
        setAccount(accountData as AccountType);

        const currentSeasonCandidate = seasons?.find((season) => season.isCurrent) ?? {
          ...responseCurrentSeason,
          isCurrent: true,
        };
        setCurrentSeason(currentSeasonCandidate as AccountSeasonWithStatusType);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to fetch account data:', err);
        setError('Failed to load account data');
        setAccount(null);
        setCurrentSeason(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAccountData();

    return () => {
      isMounted = false;
    };
  }, [accountIdStr, apiClient]);

  useEffect(() => {
    if (!accountIdStr || !isAccountMember) {
      setAccountAnnouncements([]);
      setAccountAnnouncementsError(null);
      setAccountAnnouncementsLoading(false);
      return;
    }

    let ignore = false;

    const fetchAnnouncements = async () => {
      setAccountAnnouncementsLoading(true);
      setAccountAnnouncementsError(null);

      try {
        const data = await announcementService.listAccountAnnouncements(accountIdStr);

        if (ignore) {
          return;
        }

        setAccountAnnouncements(data);
      } catch (err) {
        if (ignore) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to load account announcements';
        setAccountAnnouncementsError(message);
        setAccountAnnouncements([]);
      } finally {
        if (!ignore) {
          setAccountAnnouncementsLoading(false);
        }
      }
    };

    void fetchAnnouncements();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, announcementService, isAccountMember]);

  useEffect(() => {
    if (!accountIdStr || !currentSeason?.id) {
      setSeasonTeamIds(null);
      setSeasonLeagueHierarchy([]);
      return;
    }

    let ignore = false;

    const fetchSeasonLeagueHierarchy = async () => {
      try {
        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId: accountIdStr, seasonId: currentSeason.id },
          query: { includeTeams: true, includeUnassignedTeams: true },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const leagueSetup = unwrapApiResult(result, 'Failed to load season league hierarchy');
        const mappedSetup = mapLeagueSetup(leagueSetup);
        const leagueSeasons = mappedSetup.leagueSeasons ?? [];

        setSeasonLeagueHierarchy(leagueSeasons);

        const ids = new Set<string>();
        leagueSeasons.forEach((league) => {
          league.divisions?.forEach((division) => {
            division.teams.forEach((team) => {
              if (team.team?.id) {
                ids.add(team.team.id);
              }
            });
          });
          league.unassignedTeams?.forEach((team) => {
            if (team.team?.id) {
              ids.add(team.team.id);
            }
          });
        });

        setSeasonTeamIds(Array.from(ids));
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to load season league hierarchy:', err);
          setSeasonLeagueHierarchy([]);
          setSeasonTeamIds([]);
        }
      }
    };

    void fetchSeasonLeagueHierarchy();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, currentSeason?.id, apiClient]);

  // Fetch user teams if logged in
  useEffect(() => {
    if (!accountIdStr || !user || !token) return;

    let ignore = false;

    const fetchUserTeams = async () => {
      try {
        const result = await getAccountUserTeams({
          client: apiClient,
          path: { accountId: accountIdStr },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const teamsResponse = unwrapApiResult(result, 'Failed to load teams');

        if (ignore) {
          return;
        }

        const normalizedTeams = Array.isArray(teamsResponse) ? teamsResponse : [];
        const teams: UserTeam[] = normalizedTeams.map((team) => ({
          id: team.id,
          name: team.name ?? 'Team',
          leagueName: team.league?.name ?? 'Unknown League',
          divisionName: team.division?.name ?? undefined,
          teamId: team.team?.id,
        }));

        setUserTeams(teams);
      } catch (err) {
        if (!ignore) {
          console.warn('Failed to fetch user teams:', err);
        }
      }
    };

    fetchUserTeams();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, user, token, apiClient]);

  useEffect(() => {
    if (!accountIdStr || !isAccountMember) {
      setTeamAnnouncements([]);
      setTeamAnnouncementsError(null);
      setTeamAnnouncementsLoading(false);
      return;
    }

    if (userTeams.length === 0) {
      setTeamAnnouncements([]);
      setTeamAnnouncementsError(null);
      setTeamAnnouncementsLoading(false);
      return;
    }

    let ignore = false;

    const fetchTeamAnnouncements = async () => {
      setTeamAnnouncementsLoading(true);
      setTeamAnnouncementsError(null);

      try {
        const errors: string[] = [];

        const sections = await Promise.all(
          userTeams
            .filter((team) => team.teamId)
            .map(async (team) => {
              try {
                const data = await announcementService.listTeamAnnouncements({
                  accountId: accountIdStr,
                  teamId: team.teamId!,
                });

                return {
                  teamId: team.teamId!,
                  teamSeasonId: team.id,
                  seasonId: null,
                  leagueName: team.leagueName,
                  teamName: team.name,
                  announcements: data,
                } as TeamAnnouncementSection;
              } catch (error) {
                console.warn(
                  `Failed to load announcements for team ${team.name} (${team.teamId}) in account ${accountIdStr}:`,
                  error,
                );
                errors.push(team.name);
                return {
                  teamId: team.teamId ?? team.id,
                  teamSeasonId: team.id,
                  seasonId: null,
                  leagueName: team.leagueName,
                  teamName: team.name,
                  announcements: [],
                } as TeamAnnouncementSection;
              }
            }),
        );

        if (ignore) {
          return;
        }

        setTeamAnnouncements(sections);
        if (errors.length > 0) {
          setTeamAnnouncementsError(
            `Failed to load announcements for ${errors.join(', ')}. Please try again.`,
          );
        } else {
          setTeamAnnouncementsError(null);
        }
      } catch (err) {
        if (ignore) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to load team announcements';
        setTeamAnnouncementsError(message);
        setTeamAnnouncements([]);
      } finally {
        if (!ignore) {
          setTeamAnnouncementsLoading(false);
        }
      }
    };

    void fetchTeamAnnouncements();

    return () => {
      ignore = true;
    };
  }, [accountIdStr, announcementService, isAccountMember, userTeams]);

  useEffect(() => {
    if (!accountIdStr) return;

    const service = new SponsorService();
    service
      .listAccountSponsors(accountIdStr)
      .then((sponsors) => {
        setAccountSponsors(sponsors);
        setSponsorError(null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load account sponsors:', error);
        setSponsorError('Sponsors are currently unavailable.');
      });
  }, [accountIdStr]);

  const shouldShowAccountSponsors = accountSponsors.length > 0 || Boolean(sponsorError);

  const handleViewTeam = (teamSeasonId: string) => {
    if (!currentSeason) return;
    router.push(`/account/${accountIdStr}/seasons/${currentSeason.id}/teams/${teamSeasonId}`);
  };

  // Early return if accountId is missing - must be after all hooks
  if (!accountIdStr) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account ID not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Account not found
        </Alert>
        <Button variant="outlined" onClick={() => router.push('/accounts')}>
          Back to Accounts
        </Button>
      </Container>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Unified Header with Logo and Page Content */}
      <Box>
        <AccountPageHeader accountId={account.id} accountLogoUrl={account.accountLogoUrl}>
          {account.configuration?.affiliation &&
            account.configuration.affiliation.name &&
            account.configuration.affiliation.name.trim().toLowerCase() !== 'no affiliation' && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  mb: 1,
                  justifyContent: 'center',
                }}
              >
                {account.configuration.affiliation.url ? (
                  <Chip
                    label={account.configuration.affiliation.name}
                    component="a"
                    href={account.configuration.affiliation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      textDecoration: 'none',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        textDecoration: 'underline',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                ) : (
                  <Chip
                    label={account.configuration.affiliation.name}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      '& .MuiChip-icon': {
                        color: 'white',
                      },
                    }}
                    icon={<GroupIcon />}
                  />
                )}
              </Box>
            )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="body1"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: (theme) => theme.palette.text.primary,
                textAlign: 'center',
              }}
            >
              <LocationIcon fontSize="small" />
              {currentSeason ? `${currentSeason.name} Season` : 'No Current Season'} • Established{' '}
              {account.configuration?.firstYear}
            </Typography>
          </Box>
        </AccountPageHeader>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2.2fr) minmax(0, 1fr)' },
            gap: { xs: 4, lg: 6 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <JoinLeagueDashboard
              accountId={accountIdStr}
              account={account}
              token={token || undefined}
              isAccountMember={isAccountMember}
            />

            {showInformationWidget && accountIdStr ? (
              <InformationWidget
                accountId={accountIdStr}
                showAccountMessages
                showTeamMessages={false}
                title="Information Center"
              />
            ) : null}

            {isAccountMember ? (
              <SpecialAnnouncementsWidget
                announcements={specialAnnouncements}
                loading={accountAnnouncementsLoading || teamAnnouncementsLoading}
                error={accountAnnouncementsError ?? teamAnnouncementsError}
                viewAllHref={`/account/${accountIdStr}/announcements`}
                showSourceLabels={false}
              />
            ) : null}

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: showSubmissionPanel
                  ? {
                      xs: '1fr',
                      lg: 'minmax(0, 2.1fr) minmax(0, 1fr)',
                    }
                  : '1fr',
                alignItems: 'stretch',
              }}
            >
              <PhotoGallerySection
                title="Photo Gallery"
                description={`Relive the highlights from ${accountDisplayName}.`}
                photos={filteredGalleryPhotos}
                albums={seasonFilteredAlbums}
                loading={galleryLoading}
                error={galleryError}
                onRefresh={refreshGallery}
                emptyMessage="No photos have been published yet."
                enableAlbumTabs
                selectedAlbumKey={selectedAlbumKey}
                onAlbumChange={handleAlbumTabChange}
                totalCountOverride={seasonFilteredPhotos.length}
                teamAlbumHierarchy={teamAlbumHierarchy}
                sx={{ height: '100%' }}
              />
              <PhotoSubmissionPanel
                variant="account"
                enabled={showSubmissionPanel}
                isLoading={membershipLoading}
                error={membershipError}
                canSubmit={canSubmitPhotos}
                accountId={accountIdStr ?? ''}
                contextName={accountDisplayName}
                albumOptions={submissionAlbumOptions}
                onSubmitted={() => {
                  void refreshPendingSubmissions();
                }}
              />
              {shouldShowPendingPanel ? (
                <PendingPhotoSubmissionsPanel
                  containerSx={{ p: 3, mb: 2 }}
                  contextLabel={accountDisplayName}
                  submissions={pendingSubmissions}
                  loading={pendingLoading}
                  error={pendingError}
                  successMessage={pendingSuccess}
                  processingIds={pendingProcessingIds}
                  onRefresh={refreshPendingSubmissions}
                  onApprove={handleApprovePendingSubmission}
                  onDeny={denyPendingSubmission}
                  onClearStatus={clearPendingStatus}
                  emptyMessage="No pending photo submissions for this account."
                />
              ) : null}
            </Box>

            {shouldShowAccountSponsors ? (
              <SponsorCard
                sponsors={accountSponsors}
                title="Account Sponsors"
                emptyMessage={sponsorError ?? undefined}
              />
            ) : null}

            {user && userTeams.length > 0 ? (
              <MyTeams userTeams={userTeams} onViewTeam={handleViewTeam} title="Your Teams" />
            ) : null}

            {user ? (
              <Box sx={{ display: showOrganizationsWidget ? 'block' : 'none' }}>
                <OrganizationsWidget
                  title="Your Other Organizations"
                  showSearch={false}
                  maxDisplay={3}
                  sx={{ mb: 0 }}
                  excludeAccountId={accountIdStr}
                  onOrganizationsLoaded={(organizations) => {
                    setShowOrganizationsWidget(organizations.length > 0);
                  }}
                />
              </Box>
            ) : null}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {hasAccountContact ? (
              <AccountPollsCard accountId={accountIdStr} isAuthorizedForAccount />
            ) : null}

            {currentSeason ? (
              <TodayScoreboard
                accountId={accountIdStr}
                layout="vertical"
                currentSeasonId={currentSeason.id}
              />
            ) : null}

            {currentSeason ? (
              <GameRecapsWidget accountId={accountIdStr} seasonId={currentSeason.id} />
            ) : null}

            {currentSeason ? (
              <YesterdayScoreboard
                accountId={accountIdStr}
                layout="vertical"
                currentSeasonId={currentSeason.id}
              />
            ) : null}

            {leaderLeagues.length > 0 && accountIdStr ? (
              <LeadersWidget
                accountId={accountIdStr}
                seasonId={currentSeasonId}
                leagues={leaderLeagues}
                divisionId="0"
                randomize
              />
            ) : null}

            {accountIdStr ? (
              <AccountOptional accountId={accountIdStr} componentId="account.playerSurvey.widget">
                <SurveySpotlightWidget
                  accountId={accountIdStr}
                  canAnswerSurvey={hasAccountContact}
                />
              </AccountOptional>
            ) : null}

            <TodaysBirthdaysCard
              accountId={accountIdStr}
              hasActiveSeason={Boolean(currentSeason)}
            />

            {accountIdStr ? (
              <AccountOptional accountId={accountIdStr} componentId="account.home.hallOfFame">
                <HofSpotlightWidget accountId={accountIdStr} />
              </AccountOptional>
            ) : null}

            {accountIdStr ? (
              <AccountOptional accountId={accountIdStr} componentId="account.home.hallOfFame">
                <HofNominationWidget accountId={accountIdStr} />
              </AccountOptional>
            ) : null}
          </Box>
        </Box>
      </Container>
    </main>
  );
};

export default BaseballAccountHome;

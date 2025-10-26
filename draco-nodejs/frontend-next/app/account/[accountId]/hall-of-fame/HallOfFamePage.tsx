'use client';

import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  Divider,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Button,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SearchIcon from '@mui/icons-material/Search';
import { useParams } from 'next/navigation';
import {
  getAccountHallOfFameClass,
  getAccountHallOfFameNominationSetup,
  getAccountHallOfFameRandomMember,
  listAccountHallOfFameClasses,
} from '@draco/shared-api-client';
import {
  HofMemberSchema,
  type HofClassSummaryType,
  type HofMemberType,
  type HofNominationSetupType,
} from '@draco/shared-schemas';
import AccountPageHeader from '@/components/AccountPageHeader';
import HofMemberCard from '@/components/hall-of-fame/HofMemberCard';
import HofNominationDialog from '@/components/hall-of-fame/HofNominationDialog';
import useCarousel from '@/components/profile/useCarousel';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';
import { sanitizeRichContent } from '@/utils/sanitization';

const NOMINATION_SUCCESS_MESSAGE =
  'Thanks for the nomination! Our administrators will review it shortly.';

type ClassPortrait = {
  photoUrl: string | null;
  displayName: string;
};

const HallOfFamePage: React.FC = () => {
  const params = useParams();
  const apiClient = useApiClient();

  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const [classSummaries, setClassSummaries] = React.useState<HofClassSummaryType[]>([]);
  const [selectedClassIndex, setSelectedClassIndex] = React.useState(0);
  const [membersByYear, setMembersByYear] = React.useState<Record<number, HofMemberType[]>>({});
  const [loadingClasses, setLoadingClasses] = React.useState(true);
  const [loadingMembersYear, setLoadingMembersYear] = React.useState<number | null>(null);
  const [classesError, setClassesError] = React.useState<string | null>(null);
  const [membersError, setMembersError] = React.useState<string | null>(null);
  const [randomMember, setRandomMember] = React.useState<HofMemberType | null>(null);
  const [nominationSetup, setNominationSetup] = React.useState<HofNominationSetupType | null>(null);
  const [nominationDialogOpen, setNominationDialogOpen] = React.useState(false);
  const [successSnackbarOpen, setSuccessSnackbarOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<HofMemberType[] | null>(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const carousel = useCarousel({
    total: classSummaries.length,
    visibleItems: 1,
    loop: false,
  });

  const classCardRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const membersByYearRef = React.useRef<Record<number, HofMemberType[]>>({});
  const classPortraitsRef = React.useRef<Record<number, ClassPortrait | null>>({});
  const portraitPrefetchingRef = React.useRef<Set<number>>(new Set());

  const [classPortraits, setClassPortraits] = React.useState<Record<number, ClassPortrait | null>>(
    {},
  );

  React.useEffect(() => {
    membersByYearRef.current = membersByYear;
  }, [membersByYear]);

  React.useEffect(() => {
    classPortraitsRef.current = classPortraits;
  }, [classPortraits]);

  React.useEffect(() => {
    membersByYearRef.current = {};
    setMembersByYear({});
    setMembersError(null);
    setLoadingMembersYear(null);
    setSelectedClassIndex(0);
    setClassPortraits({});
    classPortraitsRef.current = {};
    portraitPrefetchingRef.current = new Set();
    setSearchResults(null);
    setSearchTerm('');
    setSearchError(null);
    setSearchLoading(false);
  }, [accountId]);

  const selectRandomPortrait = React.useCallback(
    (members: HofMemberType[]): ClassPortrait | null => {
      if (!members || members.length === 0) {
        return null;
      }
      const randomIndex = Math.floor(Math.random() * members.length);
      const selected = members[randomIndex];
      const displayName =
        selected.contact.displayName ??
        (`${selected.contact.firstName ?? ''} ${selected.contact.lastName ?? ''}`.trim() ||
          'Hall of Fame Member');
      return {
        photoUrl: selected.contact.photoUrl ?? null,
        displayName,
      };
    },
    [],
  );

  const fetchMembersForYear = React.useCallback(
    async (year: number, options?: { allowExisting?: boolean; suppressLoading?: boolean }) => {
      if (!accountId) {
        return;
      }

      const allowExisting = options?.allowExisting ?? false;
      const suppressLoading = options?.suppressLoading ?? false;

      const existingMembers = membersByYearRef.current[year];

      if (!allowExisting && existingMembers) {
        if (classPortraitsRef.current[year] === undefined) {
          const portrait = selectRandomPortrait(existingMembers);
          setClassPortraits((prev) => {
            if (prev[year] !== undefined) {
              return prev;
            }
            const next = { ...prev, [year]: portrait ?? null };
            classPortraitsRef.current = next;
            return next;
          });
        }
        return;
      }

      if (!suppressLoading) {
        setLoadingMembersYear(year);
        setMembersError(null);
      }

      try {
        const result = await getAccountHallOfFameClass({
          client: apiClient,
          path: { accountId, year },
          throwOnError: false,
        });
        const data = unwrapApiResult(result, 'Unable to load Hall of Fame class.');
        const normalizedMembers = HofMemberSchema.array().parse(data.members);
        setMembersByYear((prev) => {
          if (prev[year] && !allowExisting) {
            return prev;
          }
          const next = { ...prev, [year]: normalizedMembers };
          membersByYearRef.current = next;
          return next;
        });
        setClassPortraits((prev) => {
          if (prev[year] !== undefined) {
            return prev;
          }
          const portrait = selectRandomPortrait(normalizedMembers);
          const next = { ...prev, [year]: portrait ?? null };
          classPortraitsRef.current = next;
          return next;
        });
      } catch (error) {
        if (!suppressLoading) {
          const message =
            error instanceof ApiClientError ? error.message : 'Unable to load Hall of Fame class.';
          setMembersError(message);
        }
      } finally {
        if (!suppressLoading) {
          setLoadingMembersYear(null);
        }
      }
    },
    [accountId, apiClient, selectRandomPortrait],
  );

  const loadAllMembers = React.useCallback(async () => {
    if (!accountId) {
      return;
    }

    const missingYears = classSummaries
      .map((summary) => summary.year)
      .filter((year) => !membersByYearRef.current[year]);

    if (missingYears.length === 0) {
      return;
    }

    await Promise.all(
      missingYears.map((year) =>
        fetchMembersForYear(year, { allowExisting: true, suppressLoading: true }),
      ),
    );
  }, [accountId, classSummaries, fetchMembersForYear]);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setLoadingClasses(true);
      setClassesError(null);

      try {
        const classesResult = await listAccountHallOfFameClasses({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });
        const classes = unwrapApiResult(classesResult, 'Unable to load Hall of Fame classes.');

        if (!isMounted) {
          return;
        }

        setClassSummaries(classes);

        if (classes.length > 0) {
          setSelectedClassIndex(0);
          void fetchMembersForYear(classes[0].year);

          getAccountHallOfFameRandomMember({
            client: apiClient,
            path: { accountId },
            throwOnError: false,
          })
            .then((result) => {
              const data = unwrapApiResult(result, 'Unable to load Hall of Fame spotlight.');
              const normalizedMember = HofMemberSchema.parse(data);
              if (isMounted) {
                setRandomMember(normalizedMember);
              }
            })
            .catch(() => {
              if (isMounted) {
                setRandomMember(null);
              }
            });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof ApiClientError ? error.message : 'Unable to load Hall of Fame classes.';
        setClassesError(message);
      } finally {
        if (isMounted) {
          setLoadingClasses(false);
        }
      }
    };

    const loadNominationSetup = async () => {
      try {
        const setupResult = await getAccountHallOfFameNominationSetup({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });
        const setup = unwrapApiResult(
          setupResult,
          'Unable to load Hall of Fame nomination settings.',
        );
        if (isMounted) {
          setNominationSetup(setup);
        }
      } catch {
        if (isMounted) {
          setNominationSetup(null);
        }
      }
    };

    loadData();
    loadNominationSetup();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient, fetchMembersForYear]);

  React.useEffect(() => {
    if (!accountId || classSummaries.length === 0) {
      return;
    }

    classSummaries.forEach(({ year }) => {
      if (classPortraitsRef.current[year] !== undefined) {
        return;
      }
      if (portraitPrefetchingRef.current.has(year)) {
        return;
      }
      portraitPrefetchingRef.current.add(year);
      void fetchMembersForYear(year, { allowExisting: true, suppressLoading: true }).finally(() => {
        portraitPrefetchingRef.current.delete(year);
      });
    });
  }, [accountId, classSummaries, fetchMembersForYear]);

  const selectedClass = classSummaries[selectedClassIndex] ?? null;
  const selectedYear = selectedClass?.year ?? null;
  const membersForSelectedYear = selectedYear ? (membersByYear[selectedYear] ?? []) : [];
  const isMembersLoading = selectedYear !== null && loadingMembersYear === selectedYear;

  const handleSelectClass = React.useCallback(
    (index: number) => {
      setSelectedClassIndex(index);
      const summary = classSummaries[index];
      if (summary) {
        void fetchMembersForYear(summary.year);
        const ref = classCardRefs.current[summary.year];
        ref?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    },
    [classSummaries, fetchMembersForYear],
  );

  const handleSearchSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const term = searchTerm.trim();

      if (!term) {
        setSearchError('Enter a name to search.');
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        await loadAllMembers();
        const allMembers = Object.values(membersByYearRef.current).flat();
        const normalizedTerm = term.toLowerCase();

        const matches = allMembers
          .filter((member) => {
            const displayName = member.contact.displayName?.toLowerCase() ?? '';
            const first = member.contact.firstName?.toLowerCase() ?? '';
            const last = member.contact.lastName?.toLowerCase() ?? '';
            const fullName = `${first} ${last}`.trim();
            const reversedName = `${last} ${first}`.trim();
            return (
              displayName.includes(normalizedTerm) ||
              (fullName && fullName.includes(normalizedTerm)) ||
              (reversedName && reversedName.includes(normalizedTerm))
            );
          })
          .sort((a, b) => (a.contact.displayName ?? '').localeCompare(b.contact.displayName ?? ''))
          .slice(0, 5);

        setSearchResults(matches);
        if (matches.length === 0) {
          setSearchError(null);
        }
      } catch (error) {
        console.error('Hall of Fame search failed:', error);
        setSearchError('Unable to search inductees right now. Please try again later.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [loadAllMembers, searchTerm],
  );

  const handleClearSearch = React.useCallback(() => {
    setSearchResults(null);
    setSearchTerm('');
    setSearchError(null);
    setSearchLoading(false);
  }, []);

  const handleSearchResultSelect = React.useCallback(
    (member: HofMemberType) => {
      const index = classSummaries.findIndex((summary) => summary.year === member.yearInducted);
      if (index >= 0) {
        handleSelectClass(index);
      }
    },
    [classSummaries, handleSelectClass],
  );

  const canSubmitNomination = nominationSetup?.enableNomination ?? false;

  const handleOpenNominationDialog = React.useCallback(() => {
    if (!canSubmitNomination) {
      return;
    }
    setNominationDialogOpen(true);
  }, [canSubmitNomination]);

  const handleNominationSuccess = () => {
    setSuccessSnackbarOpen(true);
  };

  const sanitizedCriteria = React.useMemo(() => {
    if (!nominationSetup?.criteriaText) {
      return null;
    }
    const sanitized = sanitizeRichContent(nominationSetup.criteriaText);
    return sanitized.length > 0 ? sanitized : null;
  }, [nominationSetup]);

  if (!accountId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box textAlign="center">
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              mb: 1,
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <EmojiEventsIcon sx={{ color: 'gold' }} /> Hall of Fame
          </Typography>
          <Typography variant="body1" sx={{ color: 'white', opacity: 0.85 }}>
            Celebrate legendary contributors and revisit the moments that shaped your organization.
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {classesError && <Alert severity="error">{classesError}</Alert>}

        {loadingClasses ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : classSummaries.length === 0 ? (
          <Alert severity="info">Hall of Fame members have not been inducted yet.</Alert>
        ) : (
          <Stack spacing={4}>
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, md: 3 },
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Hall of Fame Classes
                </Typography>
              </Stack>

              <Box sx={{ position: 'relative', mt: 2, pt: 1, pb: 1 }}>
                <Box
                  ref={carousel.registerNode}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    py: 1,
                    overflowX: 'hidden',
                    overflowY: 'visible',
                    scrollBehavior: 'smooth',
                    px: classSummaries.length > 1 ? 5 : 0,
                  }}
                >
                  {classSummaries.map((hofClass, index) => {
                    const isSelected = index === selectedClassIndex;
                    const portrait = classPortraits[hofClass.year];
                    return (
                      <Paper
                        key={hofClass.year}
                        ref={(node) => {
                          classCardRefs.current[hofClass.year] = node;
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectClass(index)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectClass(index);
                          }
                        }}
                        elevation={isSelected ? 6 : 1}
                        sx={{
                          flex: '0 0 260px',
                          px: 3,
                          py: 3,
                          cursor: 'pointer',
                          borderRadius: 3,
                          border: '2px solid',
                          borderColor: isSelected ? 'primary.main' : 'transparent',
                          backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: (theme) => theme.shadows[6],
                          },
                        }}
                      >
                        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Class of
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {hofClass.year}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {hofClass.memberCount === 1
                              ? '1 inductee'
                              : `${hofClass.memberCount} inductees`}
                          </Typography>
                        </Box>
                        {portrait ? (
                          <Avatar
                            alt={portrait.displayName}
                            src={portrait.photoUrl ?? undefined}
                            variant="rounded"
                            sx={{
                              width: 56,
                              height: 56,
                              border: '2px solid',
                              borderColor: 'warning.light',
                              bgcolor: portrait.photoUrl ? 'transparent' : 'warning.light',
                              color: 'text.primary',
                              fontWeight: 700,
                            }}
                          >
                            {portrait.photoUrl ? null : (portrait.displayName?.charAt(0) ?? 'H')}
                          </Avatar>
                        ) : null}
                      </Paper>
                    );
                  })}
                </Box>

                {classSummaries.length > 1 ? (
                  <>
                    <IconButton
                      aria-label="Previous class"
                      onClick={carousel.handlePrev}
                      disabled={!carousel.canGoPrev}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 16,
                        transform: 'translateY(-50%)',
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                      }}
                    >
                      <ArrowBackIosIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      aria-label="Next class"
                      onClick={carousel.handleNext}
                      disabled={!carousel.canGoNext}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        right: 16,
                        transform: 'translateY(-50%)',
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'background.paper',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                        },
                      }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : null}
              </Box>
            </Paper>

            {canSubmitNomination ? (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Share the next great story
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Help us recognize outstanding contributors by nominating a deserving individual.
                  </Typography>
                  {sanitizedCriteria ? (
                    <Typography
                      component="div"
                      variant="body2"
                      color="text.secondary"
                      sx={{ '& p': { mb: 0.5, '&:last-of-type': { mb: 0 } } }}
                      dangerouslySetInnerHTML={{ __html: sanitizedCriteria }}
                    />
                  ) : null}
                </Stack>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleOpenNominationDialog}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, minWidth: { sm: 200 } }}
                >
                  Submit a Nomination
                </Button>
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
              <Stack
                spacing={2}
                sx={{
                  flex: { xs: '1 1 auto', md: '0 0 320px' },
                  alignSelf: { xs: 'stretch', md: 'flex-start' },
                }}
              >
                {searchResults === null ? (
                  <Paper
                    component="form"
                    onSubmit={handleSearchSubmit}
                    elevation={3}
                    sx={{ p: 2, borderRadius: 3 }}
                  >
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Find an Inductee
                      </Typography>
                      <TextField
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          if (searchError) {
                            setSearchError(null);
                          }
                        }}
                        placeholder="Search Hall of Fame members"
                        fullWidth
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                type="submit"
                                edge="end"
                                aria-label="search inductees"
                                disabled={searchLoading || searchTerm.trim().length === 0}
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {searchLoading ? <LinearProgress /> : null}
                      {searchError ? (
                        <Alert severity="error" sx={{ mt: 0.5 }}>
                          {searchError}
                        </Alert>
                      ) : null}
                    </Stack>
                  </Paper>
                ) : (
                  <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Search Results
                        </Typography>
                        <Button size="small" onClick={handleClearSearch}>
                          New Search
                        </Button>
                      </Stack>
                      {searchLoading ? (
                        <LinearProgress />
                      ) : searchError ? (
                        <Alert severity="error">{searchError}</Alert>
                      ) : searchResults.length > 0 ? (
                        <List dense disablePadding>
                          {searchResults.map((member, index) => {
                            const displayName =
                              member.contact.displayName ??
                              `${member.contact.firstName ?? ''} ${member.contact.lastName ?? ''}`.trim();
                            return (
                              <React.Fragment key={member.id}>
                                <ListItem disablePadding>
                                  <ListItemButton onClick={() => handleSearchResultSelect(member)}>
                                    <ListItemAvatar>
                                      <Avatar
                                        src={member.contact.photoUrl ?? undefined}
                                        alt={displayName}
                                      >
                                        {displayName ? displayName.charAt(0) : 'H'}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={displayName}
                                      secondary={`Class of ${member.yearInducted}`}
                                    />
                                  </ListItemButton>
                                </ListItem>
                                {index < searchResults.length - 1 ? (
                                  <Divider component="li" />
                                ) : null}
                              </React.Fragment>
                            );
                          })}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No inductees matched {`"${searchTerm.trim()}"`}.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                )}

                {randomMember ? (
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background:
                        'linear-gradient(180deg, rgba(255,215,64,0.18) 0%, rgba(255,215,64,0.05) 100%)',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Spotlight Inductee
                    </Typography>
                    <HofMemberCard member={randomMember} elevation={0} />
                  </Paper>
                ) : null}
              </Stack>

              <Box sx={{ flex: '1 1 auto' }}>
                {membersError && <Alert severity="error">{membersError}</Alert>}
                {isMembersLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {membersForSelectedYear.map((member) => (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={member.id}>
                        <HofMemberCard member={member} />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {!isMembersLoading && membersForSelectedYear.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Members for this Hall of Fame class will appear soon.
                  </Alert>
                )}
              </Box>
            </Stack>
          </Stack>
        )}
      </Container>

      {nominationSetup?.enableNomination && (
        <HofNominationDialog
          accountId={accountId}
          open={nominationDialogOpen}
          onClose={() => setNominationDialogOpen(false)}
          onSubmitted={handleNominationSuccess}
          criteriaText={nominationSetup?.criteriaText}
        />
      )}

      <Snackbar
        open={successSnackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSuccessSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessSnackbarOpen(false)}>
          {NOMINATION_SUCCESS_MESSAGE}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default HallOfFamePage;

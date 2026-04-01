'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { getGolfPlayerDetailedStats } from '@draco/shared-api-client';
import type { GolfPlayerDetailedStatsType } from '@draco/shared-schemas';
import { useApiClient } from '../../../hooks/useApiClient';

interface PlayerStatsDetailPanelProps {
  accountId: string;
  contactId: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" color="primary.main">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function PlayerStatsDetailPanel({
  accountId,
  contactId,
}: PlayerStatsDetailPanelProps) {
  const apiClient = useApiClient();
  const [stats, setStats] = useState<GolfPlayerDetailedStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !contactId) return;

    const controller = new AbortController();

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getGolfPlayerDetailedStats({
          client: apiClient,
          path: { accountId, contactId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.error) {
          const errorObj = result.error as { message?: string };
          setError(errorObj?.message ?? 'Failed to load player stats');
        } else if (result.data !== undefined) {
          setStats(result.data);
        } else {
          setError('Failed to load player stats');
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load player stats');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      controller.abort();
    };
  }, [accountId, contactId, apiClient]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Low Score" value={stats.lowActualScore} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="High Score" value={stats.highActualScore} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Avg Score" value={stats.averageScore.toFixed(1)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Rounds Played" value={stats.roundsPlayed} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Score Type Distribution
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Aces</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.aces}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Eagles</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.eagles}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Birdies</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.birdies}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pars</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.pars}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bogeys</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.bogeys}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Double Bogeys</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.doubleBogeys}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Triples+</TableCell>
                    <TableCell align="right">{stats.scoreTypeCounts.triplesOrWorse}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Per-Round Records
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Most Birdies in a Round</TableCell>
                    <TableCell align="right">{stats.maxBirdiesInRound}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Most Pars in a Round</TableCell>
                    <TableCell align="right">{stats.maxParsInRound}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {stats.consistencyStdDev !== undefined && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Consistency
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Std Dev</TableCell>
                      <TableCell align="right">{stats.consistencyStdDev.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {stats.scramblingPercentage !== undefined && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scrambling
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Scrambling %</TableCell>
                      <TableCell align="right">{stats.scramblingPercentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Grid>

        {stats.puttStats && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Putt Stats
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Avg Putts/Round</TableCell>
                      <TableCell align="right">
                        {stats.puttStats.averagePerRound.toFixed(1)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Best</TableCell>
                      <TableCell align="right">{stats.puttStats.bestRound}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Worst</TableCell>
                      <TableCell align="right">{stats.puttStats.worstRound}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.fairwayStats && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fairway Stats
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Avg %</TableCell>
                      <TableCell align="right">
                        {stats.fairwayStats.averagePercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Best %</TableCell>
                      <TableCell align="right">
                        {stats.fairwayStats.bestPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Worst %</TableCell>
                      <TableCell align="right">
                        {stats.fairwayStats.worstPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.girStats && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  GIR Stats
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Avg %</TableCell>
                      <TableCell align="right">
                        {stats.girStats.averagePercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Best %</TableCell>
                      <TableCell align="right">
                        {stats.girStats.bestPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Worst %</TableCell>
                      <TableCell align="right">
                        {stats.girStats.worstPercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.holeTypeStats &&
          (stats.holeTypeStats.par3Average !== undefined ||
            stats.holeTypeStats.par4Average !== undefined ||
            stats.holeTypeStats.par5Average !== undefined) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hole Type Stats
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Par Type</TableCell>
                        <TableCell align="right">Avg Score</TableCell>
                        <TableCell align="right">Rounds</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.holeTypeStats.par3Average !== undefined && (
                        <TableRow>
                          <TableCell>Par 3</TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par3Average.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par3Rounds ?? '--'}
                          </TableCell>
                        </TableRow>
                      )}
                      {stats.holeTypeStats.par4Average !== undefined && (
                        <TableRow>
                          <TableCell>Par 4</TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par4Average.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par4Rounds ?? '--'}
                          </TableCell>
                        </TableRow>
                      )}
                      {stats.holeTypeStats.par5Average !== undefined && (
                        <TableRow>
                          <TableCell>Par 5</TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par5Average.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {stats.holeTypeStats.par5Rounds ?? '--'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}
      </Grid>
    </Box>
  );
}

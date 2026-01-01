'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { GolfCourseWithTeesType } from '@draco/shared-schemas';

interface CourseScorecardProps {
  course: GolfCourseWithTeesType;
  showTees?: boolean;
  selectedTeeId?: string | null;
}

interface HoleData {
  hole: number;
  mensPar: number;
  womansPar: number;
  mensHandicap: number;
  womansHandicap: number;
  distances: Record<string, number>;
}

const CourseScorecard: React.FC<CourseScorecardProps> = ({
  course,
  showTees = true,
  selectedTeeId = null,
}) => {
  const tees = useMemo(() => {
    if (!showTees || !course.tees) return [];
    if (selectedTeeId) {
      return course.tees.filter((tee) => tee.id === selectedTeeId);
    }
    return [...course.tees].sort((a, b) => a.priority - b.priority);
  }, [course.tees, showTees, selectedTeeId]);

  const holes: HoleData[] = useMemo(() => {
    return Array.from({ length: course.numberOfHoles }, (_, i) => ({
      hole: i + 1,
      mensPar: course.mensPar[i],
      womansPar: course.womansPar[i],
      mensHandicap: course.mensHandicap[i],
      womansHandicap: course.womansHandicap[i],
      distances: tees.reduce(
        (acc, tee) => {
          acc[tee.id] = tee.distances[i];
          return acc;
        },
        {} as Record<string, number>,
      ),
    }));
  }, [course, tees]);

  const frontNine = holes.slice(0, 9);
  const backNine = holes.slice(9, 18);

  const calculateTotals = (holeRange: HoleData[], field: 'mensPar' | 'womansPar') => {
    return holeRange.reduce((sum, hole) => sum + hole[field], 0);
  };

  const calculateDistanceTotals = (holeRange: HoleData[], teeId: string) => {
    return holeRange.reduce((sum, hole) => sum + (hole.distances[teeId] || 0), 0);
  };

  const renderNineHoles = (holeRange: HoleData[], label: string) => (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', mb: 2 }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>{label}</TableCell>
            {holeRange.map((hole) => (
              <TableCell key={hole.hole} align="center" sx={{ fontWeight: 600, minWidth: 40 }}>
                {hole.hole}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 600, minWidth: 50, bgcolor: 'grey.200' }}>
              Out
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tees.map((tee) => (
            <TableRow key={tee.id}>
              <TableCell
                sx={{
                  fontWeight: 500,
                  bgcolor: getTeeBackgroundColor(tee.teeColor),
                  color: getTeeTextColor(tee.teeColor),
                }}
              >
                {tee.teeName}
              </TableCell>
              {holeRange.map((hole) => (
                <TableCell key={hole.hole} align="center">
                  {hole.distances[tee.id] || '-'}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.50' }}>
                {calculateDistanceTotals(holeRange, tee.id)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Par (Men)</TableCell>
            {holeRange.map((hole) => (
              <TableCell key={hole.hole} align="center">
                {hole.mensPar}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
              {calculateTotals(holeRange, 'mensPar')}
            </TableCell>
          </TableRow>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Par (Women)</TableCell>
            {holeRange.map((hole) => (
              <TableCell key={hole.hole} align="center">
                {hole.womansPar}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
              {calculateTotals(holeRange, 'womansPar')}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>Hdcp (Men)</TableCell>
            {holeRange.map((hole) => (
              <TableCell key={hole.hole} align="center" sx={{ color: 'text.secondary' }}>
                {hole.mensHandicap}
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>Hdcp (Women)</TableCell>
            {holeRange.map((hole) => (
              <TableCell key={hole.hole} align="center" sx={{ color: 'text.secondary' }}>
                {hole.womansHandicap}
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {course.name}
        </Typography>
        {(course.city || course.state) && (
          <Typography variant="body2" color="text.secondary">
            {[course.city, course.state].filter(Boolean).join(', ')}
          </Typography>
        )}
      </Box>

      {showTees && tees.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Tee Ratings & Slopes
          </Typography>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: 1, borderColor: 'divider' }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Tee</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Rating (M)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Slope (M)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Rating (W)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Slope (W)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tees.map((tee) => (
                  <TableRow key={tee.id}>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        bgcolor: getTeeBackgroundColor(tee.teeColor),
                        color: getTeeTextColor(tee.teeColor),
                      }}
                    >
                      {tee.teeName}
                    </TableCell>
                    <TableCell align="center">{tee.mensRating.toFixed(1)}</TableCell>
                    <TableCell align="center">{tee.mensSlope}</TableCell>
                    <TableCell align="center">{tee.womansRating.toFixed(1)}</TableCell>
                    <TableCell align="center">{tee.womansSlope}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Scorecard
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        {renderNineHoles(frontNine, 'Front 9')}
        {backNine.length > 0 && renderNineHoles(backNine, 'Back 9')}
      </Box>
    </Box>
  );
};

function getTeeBackgroundColor(teeColor: string): string {
  const colorMap: Record<string, string> = {
    black: '#212121',
    blue: '#1976d2',
    white: '#ffffff',
    gold: '#FFD700',
    yellow: '#FFEB3B',
    red: '#d32f2f',
    green: '#388e3c',
    silver: '#9e9e9e',
    purple: '#9C27B0',
    orange: '#FF9800',
  };
  return colorMap[teeColor.toLowerCase()] || '#bdbdbd';
}

function getTeeTextColor(teeColor: string): string {
  const darkTees = ['black', 'blue', 'red', 'green', 'purple'];
  return darkTees.includes(teeColor.toLowerCase()) ? '#fff' : '#000';
}

export default CourseScorecard;

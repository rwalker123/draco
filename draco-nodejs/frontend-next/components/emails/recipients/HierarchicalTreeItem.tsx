'use client';

import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Stack,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';

interface TreeItemProps {
  id: string;
  title: string;
  subtitle?: string;
  playerCount?: number;
  managerCount?: number;
  managersOnly: boolean;
  level: number;
  isExpandable: boolean;
  isExpanded: boolean;
  isChecked: boolean;
  isIndeterminate: boolean;
  onToggleExpanded: (id: string) => void;
  onToggleSelected: (id: string) => void;
  children?: React.ReactNode;
}

const HierarchicalTreeItem: React.FC<TreeItemProps> = ({
  id,
  title,
  subtitle,
  playerCount,
  managerCount,
  managersOnly,
  level,
  isExpandable,
  isExpanded,
  isChecked,
  isIndeterminate,
  onToggleExpanded,
  onToggleSelected,
  children,
}) => {
  const getIcon = () => {
    if (level === 0) return <GroupsIcon fontSize="small" color="primary" />;
    if (level === 1) return <GroupsIcon fontSize="small" color="secondary" />;
    if (level === 2) return <GroupsIcon fontSize="small" color="action" />;
    return <PersonIcon fontSize="small" color="action" />;
  };

  const getFontWeight = () => {
    if (level === 0) return 'bold'; // Season
    if (level === 1) return 'bold'; // Leagues
    if (level === 2) return 'bold'; // Divisions
    return 'normal'; // Teams
  };

  const getTypographyVariant = () => {
    if (level === 0) return 'subtitle1'; // Season - larger
    if (level === 1) return 'body1'; // Leagues
    return 'body2'; // Divisions & Teams
  };

  const getIndentation = () => level * 24;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 40,
          paddingLeft: `${getIndentation()}px`,
          paddingRight: 2,
          paddingY: 0.5,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {/* Expansion button */}
        <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
          {isExpandable ? (
            <IconButton size="small" onClick={() => onToggleExpanded(id)} sx={{ padding: 0.25 }}>
              {isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          ) : null}
        </Box>

        {/* Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isChecked}
              indeterminate={isIndeterminate}
              onChange={() => onToggleSelected(id)}
              size="small"
            />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              {getIcon()}
              <Box>
                <Typography variant={getTypographyVariant()} fontWeight={getFontWeight()}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {(playerCount !== undefined || managerCount !== undefined) && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 'medium',
                  }}
                >
                  {managersOnly
                    ? `${managerCount || 0} ${(managerCount || 0) === 1 ? 'manager' : 'managers'}`
                    : `${playerCount || 0} ${(playerCount || 0) === 1 ? 'player' : 'players'}`}
                </Typography>
              )}
            </Stack>
          }
          sx={{
            margin: 0,
            flex: 1,
            '& .MuiFormControlLabel-label': {
              flex: 1,
            },
          }}
        />
      </Box>

      {/* Children */}
      {isExpandable && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {children}
        </Collapse>
      )}
    </Box>
  );
};

export default React.memo(HierarchicalTreeItem);

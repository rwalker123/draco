'use client';

import React, { useState } from 'react';
import { Box, Collapse, Typography, IconButton, Paper, Stack, Divider } from '@mui/material';
import { ExpandMore, ExpandLess, Info as InfoIcon } from '@mui/icons-material';
import { getRoleIcon, getRoleIconDescription, getRoleColors } from '../../utils/roleIcons';
import { ROLE_ID_TO_NAME, getRoleDisplayName } from '../../utils/roleUtils';

interface RoleLegendProps {
  variant?: 'compact' | 'detailed';
  showContext?: boolean;
}

/**
 * RoleLegend Component
 * Displays a collapsible legend showing what each role icon represents
 */
const RoleLegend: React.FC<RoleLegendProps> = ({
  variant = 'detailed',
  showContext: _showContext, // Prefixed with underscore to indicate unused
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Get all role IDs and their names
  const roleEntries = Object.entries(ROLE_ID_TO_NAME);

  // Group roles by type for better organization
  // Filter out global roles (Administrator, PhotoAdmin) as they won't appear in league user management
  const roleGroups = {
    account: roleEntries.filter(
      ([_, name]) => name === 'AccountAdmin' || name === 'AccountPhotoAdmin',
    ),
    league: roleEntries.filter(([_, name]) => name === 'LeagueAdmin'),
    team: roleEntries.filter(([_, name]) => name === 'TeamAdmin' || name === 'TeamPhotoAdmin'),
  };

  const groupLabels = {
    account: 'Account Roles',
    league: 'League Roles',
    team: 'Team Roles',
  };

  if (variant === 'compact') {
    // Filter out global roles for compact view
    const filteredRoleEntries = roleEntries.filter(
      ([_, name]) => name !== 'Administrator' && name !== 'PhotoAdmin',
    );

    return (
      <Box sx={{ mb: 2 }}>
        <IconButton
          size="small"
          onClick={handleToggle}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <InfoIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            Role Legend
          </Typography>
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>

        <Collapse in={expanded}>
          <Paper sx={{ p: 1, mt: 1, backgroundColor: 'background.default' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {filteredRoleEntries.map(([roleId, _roleName]) => {
                const IconComponent = getRoleIcon(roleId);
                const colors = getRoleColors(roleId);

                if (!IconComponent) return null;

                return (
                  <Box
                    key={roleId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      p: 0.5,
                      borderRadius: 1,
                      backgroundColor: colors?.background || 'transparent',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: colors?.hover || 'action.hover',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <IconComponent
                      fontSize="small"
                      sx={{
                        color: colors?.primary || 'primary.main',
                      }}
                    />
                    <Typography variant="caption">{getRoleDisplayName(roleId)}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
        onClick={handleToggle}
      >
        <InfoIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight="medium">
          Role Legend
        </Typography>
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>

      <Collapse in={expanded}>
        <Paper sx={{ p: 2, mt: 1, backgroundColor: 'background.default' }}>
          <Stack spacing={2}>
            {Object.entries(roleGroups).map(([groupKey, roles]) => {
              if (roles.length === 0) return null;

              return (
                <Box key={groupKey}>
                  <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                    {groupLabels[groupKey as keyof typeof groupLabels]}
                  </Typography>

                  <Stack spacing={1}>
                    {roles.map(([roleId, _roleName]) => {
                      const IconComponent = getRoleIcon(roleId);
                      const description = getRoleIconDescription(roleId);
                      const colors = getRoleColors(roleId);

                      if (!IconComponent) return null;

                      return (
                        <Box
                          key={roleId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: colors?.background || 'background.paper',
                            border: `1px solid ${colors?.primary || 'divider'}`,
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: colors?.hover || 'action.hover',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                          }}
                        >
                          <IconComponent
                            fontSize="small"
                            sx={{
                              color: colors?.primary || 'primary.main',
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {getRoleDisplayName(roleId)}
                            </Typography>
                            {description && (
                              <Typography variant="caption" color="text.secondary">
                                {description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>

                  {groupKey !== 'team' && <Divider sx={{ mt: 1 }} />}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default RoleLegend;

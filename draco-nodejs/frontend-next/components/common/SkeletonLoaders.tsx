'use client';

import React from 'react';
import { Box, Skeleton, Stack, Card, CardContent, Divider } from '@mui/material';

/**
 * ContactListSkeleton - Loading placeholder for contact lists
 */
export const ContactListSkeleton: React.FC<{
  count?: number;
  compact?: boolean;
}> = ({ count = 5, compact = false }) => {
  return (
    <Stack spacing={compact ? 1 : 1.5}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: compact ? 1 : 1.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {/* Avatar skeleton */}
          <Skeleton variant="circular" width={compact ? 32 : 40} height={compact ? 32 : 40} />

          {/* Contact info skeleton */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              variant="text"
              width="60%"
              height={compact ? 20 : 24}
              sx={{ fontSize: compact ? '0.875rem' : '1rem' }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={compact ? 16 : 20}
              sx={{ fontSize: compact ? '0.75rem' : '0.875rem' }}
            />
          </Box>

          {/* Checkbox skeleton */}
          <Skeleton variant="rectangular" width={20} height={20} />
        </Box>
      ))}
    </Stack>
  );
};

/**
 * GroupListSkeleton - Loading placeholder for team/role groups
 */
export const GroupListSkeleton: React.FC<{
  count?: number;
  compact?: boolean;
  showMembers?: boolean;
}> = ({ count = 3, compact = false, showMembers = true }) => {
  return (
    <Stack spacing={compact ? 1 : 2}>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          variant="outlined"
          sx={{
            transition: 'none',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: showMembers ? 1 : 0 }}>
              {/* Group icon skeleton */}
              <Skeleton variant="circular" width={compact ? 24 : 32} height={compact ? 24 : 32} />

              {/* Group name skeleton */}
              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="text"
                  width="40%"
                  height={compact ? 20 : 24}
                  sx={{ fontSize: compact ? '0.875rem' : '1rem' }}
                />
              </Box>

              {/* Member count skeleton */}
              <Skeleton variant="text" width={60} height={20} />

              {/* Checkbox skeleton */}
              <Skeleton variant="rectangular" width={20} height={20} />
            </Box>

            {/* Member list skeleton */}
            {showMembers && (
              <Box sx={{ ml: compact ? 4 : 5 }}>
                <Stack spacing={0.5}>
                  {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(
                    (_, memberIndex) => (
                      <Skeleton
                        key={memberIndex}
                        variant="text"
                        width={`${Math.floor(Math.random() * 40) + 30}%`}
                        height={16}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ),
                  )}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

/**
 * RecipientDialogSkeleton - Loading placeholder for the entire recipient dialog
 */
export const RecipientDialogSkeleton: React.FC<{
  showTabs?: boolean;
  showPreview?: boolean;
}> = ({ showTabs = true, showPreview = true }) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Dialog header skeleton */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width={250} height={32} />
          <Skeleton variant="circular" width={24} height={24} />
        </Stack>
      </Box>

      {/* Tabs skeleton */}
      {showTabs && (
        <Box sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={4} sx={{ py: 1 }}>
            <Skeleton variant="text" width={80} height={36} />
            <Skeleton variant="text" width={80} height={36} />
            <Skeleton variant="text" width={100} height={36} />
          </Stack>
        </Box>
      )}

      {/* Content skeleton */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main content area */}
        <Box sx={{ flex: 1, p: 3 }}>
          {/* Search bar skeleton */}
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>

          {/* Stats skeleton */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <Skeleton variant="text" width={120} height={20} />
              <Skeleton variant="text" width={100} height={20} />
              <Skeleton variant="text" width={140} height={20} />
            </Stack>
          </Box>

          {/* Content list skeleton */}
          <ContactListSkeleton count={6} />
        </Box>

        {/* Preview panel skeleton */}
        {showPreview && (
          <Box
            sx={{
              width: 320,
              borderLeft: 1,
              borderColor: 'divider',
              p: 2,
            }}
          >
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />

            {/* Selected items skeleton */}
            <Stack spacing={1}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="60%" height={20} sx={{ flex: 1 }} />
                  <Skeleton variant="circular" width={16} height={16} />
                </Box>
              ))}
            </Stack>

            {/* Summary skeleton */}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="60%" height={20} />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Actions skeleton */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width={150} height={20} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" width={80} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

/**
 * RecipientSearchSkeleton - Loading placeholder for search functionality
 */
export const RecipientSearchSkeleton: React.FC<{
  showFilters?: boolean;
}> = ({ showFilters = false }) => {
  return (
    <Box>
      {/* Search input skeleton */}
      <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />

      {/* Filters skeleton */}
      {showFilters && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
          <Skeleton variant="rounded" width={90} height={32} />
        </Stack>
      )}

      {/* Search stats skeleton */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="text" width={100} height={20} />
      </Stack>
    </Box>
  );
};

/**
 * ComposePageSkeleton - Loading placeholder for the entire compose page
 */
export const ComposePageSkeleton: React.FC<{
  showSidebar?: boolean;
}> = ({ showSidebar = true }) => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header skeleton */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="rounded" width="100%" height={48} />
        </Stack>
      </Box>

      {/* Content area skeleton */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        {/* Main content */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Stack spacing={3}>
            {/* Recipient section skeleton */}
            <Box>
              <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={56} />
            </Box>

            {/* Subject skeleton */}
            <Box>
              <Skeleton variant="text" width={100} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={48} />
            </Box>

            {/* Content editor skeleton */}
            <Box>
              <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={300} />
            </Box>

            {/* Attachments skeleton */}
            <Box>
              <Skeleton variant="text" width={140} height={24} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width="100%" height={120} />
            </Box>
          </Stack>
        </Box>

        {/* Sidebar skeleton */}
        {showSidebar && (
          <Box sx={{ width: 300, borderLeft: 1, borderColor: 'divider', p: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Skeleton variant="text" width={100} height={24} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" width="100%" height={80} />
              </Box>
              <Box>
                <Skeleton variant="text" width={120} height={24} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" width="100%" height={120} />
              </Box>
              <Box>
                <Skeleton variant="text" width={80} height={24} sx={{ mb: 1 }} />
                <Skeleton variant="rounded" width="100%" height={60} />
              </Box>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Actions skeleton */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width={150} height={20} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" width={80} height={36} />
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

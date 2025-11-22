'use client';

import React from 'react';
import { Box, Container, Stack } from '@mui/material';
import FeaturedVideosWidget from './FeaturedVideosWidget';
import SurveySpotlightWidget from '@/components/surveys/SurveySpotlightWidget';
import HofSpotlightWidget from '@/components/hall-of-fame/HofSpotlightWidget';
import PlayersWantedPreview from '@/components/join-league/PlayersWantedPreview';
import MemberBusinessSpotlightWidget from '@/components/social/MemberBusinessSpotlightWidget';
import AccountOptional from '@/components/account/AccountOptional';
import CommunityChatsWidget from './CommunityChatsWidget';
import SocialPostsWidget from './SocialPostsWidget';

interface SocialHubExperienceProps {
  accountId?: string;
  seasonId?: string;
  isAccountMember?: boolean | null;
}

export default function SocialHubExperience({
  accountId,
  seasonId,
  isAccountMember,
}: SocialHubExperienceProps) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Social Media Section */}
        <Box sx={{ flex: { xs: 1, md: '2 1 0' } }}>
          <Stack spacing={3}>
            <SocialPostsWidget accountId={accountId} seasonId={seasonId} />
            <CommunityChatsWidget accountId={accountId} seasonId={seasonId} />
            <FeaturedVideosWidget
              accountId={accountId}
              seasonId={seasonId}
              viewAllHref={accountId ? `/account/${accountId}/social-hub/videos` : undefined}
            />
          </Stack>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: { xs: 1, md: '1 1 0' } }}>
          <Box>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="account.playerSurvey.widget">
                <SurveySpotlightWidget
                  accountId={accountId}
                  canAnswerSurvey={Boolean(isAccountMember)}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="home.playerClassified.widget">
                <PlayersWantedPreview
                  accountId={accountId}
                  isAccountMember={Boolean(isAccountMember)}
                  maxDisplay={3}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="profile.memberBusiness.card">
                <MemberBusinessSpotlightWidget
                  accountId={accountId}
                  seasonId={seasonId}
                  viewAllHref={`/account/${accountId}/social-hub/member-businesses`}
                />
              </AccountOptional>
            ) : null}
          </Box>

          <Box sx={{ mb: 3 }}>
            {accountId ? (
              <AccountOptional accountId={accountId} componentId="account.home.hallOfFame">
                <HofSpotlightWidget accountId={accountId} />
              </AccountOptional>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

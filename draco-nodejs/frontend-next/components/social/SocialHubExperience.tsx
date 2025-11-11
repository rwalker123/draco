'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  IconButton,
  Button,
  Stack,
  Tabs,
  Tab,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Twitter,
  Facebook,
  YouTube,
  Instagram,
  QuestionAnswer,
  EmojiEvents,
  Search,
  FilterList,
  Refresh,
  OpenInNew,
  ThumbUp,
  Share,
  PlayCircleOutline,
  LocationOn,
  Forum,
  PersonSearch,
} from '@mui/icons-material';

// Mock data for different social sources
interface SocialCardData {
  id?: number;
  author?: string;
  handle?: string;
  content?: string;
  timestamp?: string;
  likes?: number;
  retweets?: number;
  image?: string | null;
  title?: string;
  thumbnail?: string | null;
  views?: string;
  duration?: string;
}

const mockTwitterPosts: SocialCardData[] = [
  {
    id: 1,
    author: 'Eagles Baseball',
    handle: '@eaglesbaseball',
    content: 'Great win today! Final score 7-3. Johnson with the complete game! 🦅⚾',
    timestamp: '2 hours ago',
    likes: 45,
    retweets: 12,
    image: null,
  },
  {
    id: 2,
    author: 'Coach Smith',
    handle: '@coachsmith',
    content: "Proud of our team's performance this season. Looking forward to playoffs!",
    timestamp: '5 hours ago',
    likes: 23,
    retweets: 5,
  },
];

const mockYouTubeVideos: SocialCardData[] = [
  {
    id: 1,
    title: 'Season Highlights 2024',
    thumbnail: '/api/placeholder/320/180',
    views: '1.2K',
    duration: '4:32',
    timestamp: '3 days ago',
  },
  {
    id: 2,
    title: 'Player Interview: Mike Johnson',
    thumbnail: '/api/placeholder/320/180',
    views: '856',
    duration: '12:45',
    timestamp: '1 week ago',
  },
];

const mockPlayerQuestions = [
  {
    id: 1,
    player: 'Mike Johnson',
    number: '23',
    position: 'Pitcher',
    question: 'Favorite pre-game meal?',
    answer: 'Chicken and rice, keeps me energized!',
  },
  {
    id: 2,
    player: 'Sarah Davis',
    number: '7',
    position: 'Shortstop',
    question: 'Baseball idol?',
    answer: 'Derek Jeter - smooth fielding and clutch hitting!',
  },
];

const mockMessageBoard = [
  {
    id: 1,
    author: 'TeamParent123',
    title: "Carpool for Saturday's game?",
    replies: 5,
    lastReply: '30 min ago',
    category: 'logistics',
  },
  {
    id: 2,
    author: 'BaseballFan99',
    title: 'Great pitching performance last night!',
    replies: 12,
    lastReply: '2 hours ago',
    category: 'discussion',
  },
];

const mockLookingFor = [
  {
    id: 1,
    type: 'team',
    title: 'U16 Team Looking for Pitcher',
    location: 'North Valley',
    contact: 'coach@example.com',
    posted: '2 days ago',
  },
  {
    id: 2,
    type: 'player',
    title: 'Experienced Catcher Seeking Team',
    location: 'Downtown Area',
    age: '17',
    posted: '4 days ago',
  },
];

const mockHallOfFame = [
  {
    id: 1,
    name: 'Tom Anderson',
    year: '2023',
    achievement: 'All-State pitcher, 15-0 record',
    image: '/api/placeholder/100/100',
  },
  {
    id: 2,
    name: 'Lisa Chen',
    year: '2022',
    achievement: 'League MVP, .425 batting average',
    image: '/api/placeholder/100/100',
  },
];

interface SocialHubExperienceProps {
  accountId?: string;
}

export default function SocialHubExperience({ accountId }: SocialHubExperienceProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [layoutStyle, setLayoutStyle] = useState<'grid' | 'timeline' | 'dashboard'>('grid');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Social Media Card Component
  const SocialMediaCard = ({ type, data }: { type: string; data: SocialCardData }) => {
    const timestamp = data.timestamp ?? '';
    const safeAuthor = data.author && data.author.length > 0 ? data.author : 'Community Channel';
    const avatarInitial = safeAuthor.charAt(0).toUpperCase();
    const safeHandle = data.handle ?? '';
    const safeContent = data.content ?? '';
    const safeLikes = data.likes ?? 0;
    const safeRetweets = data.retweets ?? 0;
    const safeThumbnail = data.thumbnail ?? data.image ?? undefined;
    const safeTitle = data.title ?? 'Video Highlight';
    const safeViews = data.views ?? '0';
    const safeDuration = data.duration ?? '';
    const getIcon = () => {
      switch (type) {
        case 'twitter':
          return <Twitter sx={{ color: '#1DA1F2' }} />;
        case 'facebook':
          return <Facebook sx={{ color: '#4267B2' }} />;
        case 'youtube':
          return <YouTube sx={{ color: '#FF0000' }} />;
        case 'instagram':
          return <Instagram sx={{ color: '#E4405F' }} />;
        default:
          return null;
      }
    };

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getIcon()}
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
              {timestamp}
            </Typography>
            <IconButton size="small" sx={{ ml: 'auto' }}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Box>

          {type === 'twitter' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{avatarInitial}</Avatar>
                <Box>
                  <Typography variant="subtitle2">{safeAuthor}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {safeHandle}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {safeContent}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ThumbUp fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">{safeLikes}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Share fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">{safeRetweets}</Typography>
                </Box>
              </Box>
            </>
          )}

          {type === 'youtube' && (
            <>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={safeThumbnail ?? '/api/placeholder/320/180'}
                  alt={safeTitle}
                  sx={{ borderRadius: 1 }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption">{safeDuration}</Typography>
                </Box>
                <PlayCircleOutline
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 48,
                    color: 'white',
                    opacity: 0.8,
                  }}
                />
              </Box>
              <Typography variant="subtitle2" gutterBottom>
                {safeTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {safeViews} views • {timestamp}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Grid Layout
  const GridLayout = () => (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Social Media Section */}
      <Box sx={{ flex: { xs: 1, md: '2 1 0' } }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Share sx={{ mr: 1 }} /> Recent Social Media
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {mockTwitterPosts.map((post) => (
              <Box key={post.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <SocialMediaCard type="twitter" data={post} />
              </Box>
            ))}
            {mockYouTubeVideos.map((video) => (
              <Box key={video.id} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <SocialMediaCard type="youtube" data={video} />
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Message Board */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Forum sx={{ mr: 1 }} /> Message Board
            <Chip label="5 new" size="small" color="primary" sx={{ ml: 1 }} />
          </Typography>
          <List>
            {mockMessageBoard.map((post, index) => (
              <React.Fragment key={post.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>{post.author[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={post.title}
                    secondary={`by ${post.author} • ${post.replies} replies • ${post.lastReply}`}
                  />
                  <Chip label={post.category} size="small" variant="outlined" />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
          <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
            View All Discussions
          </Button>
        </Paper>
      </Box>

      {/* Sidebar */}
      <Box sx={{ flex: { xs: 1, md: '1 1 0' } }}>
        {/* Player Questionnaires */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <QuestionAnswer sx={{ mr: 1 }} /> Player Spotlights
          </Typography>
          <Stack spacing={2}>
            {mockPlayerQuestions.map((qa) => (
              <Card key={qa.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>{qa.number}</Avatar>
                    <Box>
                      <Typography variant="subtitle2">{qa.player}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {qa.position}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    Q: {qa.question}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    A: {qa.answer}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Looking For */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonSearch sx={{ mr: 1 }} /> Looking For Players/Teams
          </Typography>
          <Stack spacing={2}>
            {mockLookingFor.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Chip
                    label={item.type === 'team' ? 'Team Seeking' : 'Player Available'}
                    size="small"
                    color={item.type === 'team' ? 'primary' : 'secondary'}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.location}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.posted}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        {/* Hall of Fame */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEvents sx={{ mr: 1, color: 'gold' }} /> Hall of Fame
          </Typography>
          <Stack spacing={2}>
            {mockHallOfFame.map((member) => (
              <Box key={member.id} sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={member.image} sx={{ width: 60, height: 60, mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2">{member.name}</Typography>
                  <Typography variant="caption" color="primary">
                    Class of {member.year}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {member.achievement}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
          <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
            View Full Hall of Fame
          </Button>
        </Paper>
      </Box>
    </Box>
  );

  // Timeline Layout
  const TimelineLayout = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Activity Timeline
        </Typography>
        <Stack spacing={3}>
          {/* Mix all activities in chronological order */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Twitter sx={{ color: '#1DA1F2', mr: 1 }} />
                <Typography variant="subtitle2">Twitter Post</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  2 hours ago
                </Typography>
              </Box>
              <Typography variant="body2">
                Great win today! Final score 7-3. Johnson with the complete game! 🦅⚾
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Forum sx={{ mr: 1 }} />
                <Typography variant="subtitle2">New Message Board Post</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  3 hours ago
                </Typography>
              </Box>
              <Typography variant="body2">
                {`"Great pitching performance last night!" - 12 replies`}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <YouTube sx={{ color: '#FF0000', mr: 1 }} />
                <Typography variant="subtitle2">New Video</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  3 days ago
                </Typography>
              </Box>
              <Typography variant="body2">Season Highlights 2024 - 1.2K views</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonSearch sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Looking For</Typography>
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  4 days ago
                </Typography>
              </Box>
              <Typography variant="body2">U16 Team Looking for Pitcher - North Valley</Typography>
            </CardContent>
          </Card>
        </Stack>
      </Paper>
    </Box>
  );

  // Dashboard Layout
  const DashboardLayout = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Stats Overview */}
      <Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 6px)' } }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                156
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Social Posts
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 6px)' } }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                23
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Discussions
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 6px)' } }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                8
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Videos
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: { xs: '1 1 calc(50% - 4px)', sm: '1 1 calc(25% - 6px)' } }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                45
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hall of Famers
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Recent Activity Feed */}
        <Box sx={{ flex: { xs: 1, md: '2 1 0' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="All" />
              <Tab label="Social Media" icon={<Badge badgeContent={4} color="primary" />} />
              <Tab label="Discussions" />
              <Tab label="Videos" />
            </Tabs>
            {activeTab === 0 && <GridLayout />}
            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mockTwitterPosts.map((post) => (
                  <Box key={post.id}>
                    <SocialMediaCard type="twitter" data={post} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ flex: { xs: 1, md: '1 1 0' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button fullWidth variant="contained" startIcon={<Twitter />}>
                Post to Twitter
              </Button>
              <Button fullWidth variant="contained" startIcon={<YouTube />}>
                Upload Video
              </Button>
              <Button fullWidth variant="contained" startIcon={<Forum />}>
                Start Discussion
              </Button>
              <Button fullWidth variant="contained" startIcon={<PersonSearch />}>
                Post Looking For
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Social Hub Concept{accountId ? ` · Account ${accountId}` : ''}
      </Typography>

      {/* Layout Selector */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Choose Layout Style:
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={layoutStyle === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setLayoutStyle('grid')}
          >
            Grid View
          </Button>
          <Button
            variant={layoutStyle === 'timeline' ? 'contained' : 'outlined'}
            onClick={() => setLayoutStyle('timeline')}
          >
            Timeline View
          </Button>
          <Button
            variant={layoutStyle === 'dashboard' ? 'contained' : 'outlined'}
            onClick={() => setLayoutStyle('dashboard')}
          >
            Dashboard View
          </Button>
        </Stack>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search all social content..."
            variant="outlined"
            size="small"
            sx={{ flex: 1, minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button startIcon={<FilterList />}>Filters</Button>
          <Button startIcon={<Refresh />}>Refresh</Button>
        </Box>
      </Paper>

      {/* Render Selected Layout */}
      {layoutStyle === 'grid' && <GridLayout />}
      {layoutStyle === 'timeline' && <TimelineLayout />}
      {layoutStyle === 'dashboard' && <DashboardLayout />}
    </Container>
  );
}

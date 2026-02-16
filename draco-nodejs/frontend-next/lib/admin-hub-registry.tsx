import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShareIcon from '@mui/icons-material/Share';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import HandshakeIcon from '@mui/icons-material/Handshake';
import BusinessIcon from '@mui/icons-material/Business';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StadiumIcon from '@mui/icons-material/Stadium';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import SportsGolfIcon from '@mui/icons-material/SportsGolf';

export interface AdminSearchItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  getHref: (accountId: string) => string;
  category: string;
  keywords: string[];
  globalAdminOnly?: boolean;
}

const baseAccountItems: AdminSearchItem[] = [
  {
    id: 'my-accounts',
    title: 'My Accounts',
    description: 'View and manage all accounts you own or administer.',
    icon: <SwitchAccountIcon />,
    getHref: () => '/account-management',
    category: 'Account',
    keywords: ['accounts', 'switch', 'manage'],
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Configure your account preferences, branding, and general settings.',
    icon: <SettingsIcon />,
    getHref: (accountId) => `/account/${accountId}/settings`,
    category: 'Account',
    keywords: ['settings', 'preferences', 'branding', 'configuration'],
  },
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Manage contacts, assign roles, and control user access.',
    icon: <PeopleIcon />,
    getHref: (accountId) => `/account/${accountId}/users`,
    category: 'Account',
    keywords: ['users', 'contacts', 'roles', 'permissions', 'access'],
  },
  {
    id: 'communications',
    title: 'Communications',
    description: 'Send emails and manage communication with your members.',
    icon: <EmailIcon />,
    getHref: (accountId) => `/account/${accountId}/communications`,
    category: 'Account',
    keywords: ['email', 'messages', 'notifications', 'send'],
  },
];

const baseSeasonItems: AdminSearchItem[] = [
  {
    id: 'season-management',
    title: 'Season Management',
    description: 'Create and manage seasons, configure leagues, and set up divisions.',
    icon: <CalendarMonthIcon />,
    getHref: (accountId) => `/account/${accountId}/seasons`,
    category: 'Season',
    keywords: ['seasons', 'leagues', 'divisions', 'create'],
  },
  {
    id: 'schedule-management',
    title: 'Schedule Management',
    description: 'Create and manage game schedules for your leagues and divisions.',
    icon: <ScheduleIcon />,
    getHref: (accountId) => `/account/${accountId}/schedule-management`,
    category: 'Season',
    keywords: ['schedule', 'games', 'calendar', 'dates'],
  },
];

const globalAdminItems: AdminSearchItem[] = [
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'System-wide administration and monitoring tools.',
    icon: <DashboardIcon />,
    getHref: () => '/admin',
    category: 'Global Admin',
    keywords: ['dashboard', 'system', 'monitoring', 'global'],
    globalAdminOnly: true,
  },
  {
    id: 'alert-management',
    title: 'Alert Management',
    description: 'Create and manage system-wide alerts and notifications.',
    icon: <CampaignIcon />,
    getHref: () => '/admin/alerts',
    category: 'Global Admin',
    keywords: ['alerts', 'notifications', 'system', 'broadcast'],
    globalAdminOnly: true,
  },
];

export function getBaseballAdminItems(): AdminSearchItem[] {
  return [
    ...baseAccountItems,
    {
      id: 'account-sponsors',
      title: 'Account Sponsors',
      description: 'Manage sponsor relationships and display sponsor information.',
      icon: <HandshakeIcon />,
      getHref: (accountId) => `/account/${accountId}/sponsors/manage`,
      category: 'Account',
      keywords: ['sponsors', 'partnerships', 'advertising'],
    },
    {
      id: 'member-businesses',
      title: 'Member Businesses',
      description: 'Showcase businesses owned or operated by your members.',
      icon: <BusinessIcon />,
      getHref: (accountId) => `/account/${accountId}/member-businesses/manage`,
      category: 'Account',
      keywords: ['businesses', 'members', 'directory', 'showcase'],
    },
    ...baseSeasonItems,
    {
      id: 'field-management',
      title: 'Field Management',
      description: 'Manage playing fields and venues for your games and practices.',
      icon: <StadiumIcon />,
      getHref: (accountId) => `/account/${accountId}/fields/manage`,
      category: 'Season',
      keywords: ['fields', 'venues', 'stadiums', 'locations', 'parks'],
    },
    {
      id: 'umpires',
      title: 'Umpires',
      description: 'Manage umpire roster and assignments for games.',
      icon: <SportsBaseballIcon />,
      getHref: (accountId) => `/account/${accountId}/umpires/manage`,
      category: 'Season',
      keywords: ['umpires', 'officials', 'referees', 'assignments'],
    },
    {
      id: 'workout-management',
      title: 'Workout Management',
      description: 'Schedule and manage team workout sessions.',
      icon: <FitnessCenterIcon />,
      getHref: (accountId) => `/account/${accountId}/workouts`,
      category: 'Season',
      keywords: ['workouts', 'training', 'practice', 'fitness', 'sessions'],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Create and manage announcements to keep your community informed.',
      icon: <CampaignIcon />,
      getHref: (accountId) => `/account/${accountId}/announcements/manage`,
      category: 'Community',
      keywords: ['announcements', 'news', 'updates', 'inform'],
    },
    {
      id: 'polls',
      title: 'Polls',
      description: 'Create polls to gather feedback and engage with members.',
      icon: <HowToVoteIcon />,
      getHref: (accountId) => `/account/${accountId}/polls/manage`,
      category: 'Community',
      keywords: ['polls', 'voting', 'feedback', 'survey'],
    },
    {
      id: 'surveys',
      title: 'Surveys',
      description: 'Design and distribute surveys to collect member insights.',
      icon: <QuizIcon />,
      getHref: (accountId) => `/account/${accountId}/surveys/manage`,
      category: 'Community',
      keywords: ['surveys', 'questionnaire', 'feedback', 'insights'],
    },
    {
      id: 'hall-of-fame',
      title: 'Hall of Fame',
      description: 'Honor outstanding members and their achievements.',
      icon: <EmojiEventsIcon />,
      getHref: (accountId) => `/account/${accountId}/hall-of-fame/manage`,
      category: 'Community',
      keywords: ['hall of fame', 'awards', 'achievements', 'honors', 'recognition'],
    },
    {
      id: 'photo-gallery',
      title: 'Photo Gallery',
      description: 'Manage photo submissions and curate the community gallery.',
      icon: <PhotoLibraryIcon />,
      getHref: (accountId) => `/account/${accountId}/photo-gallery/admin`,
      category: 'Community',
      keywords: ['photos', 'images', 'pictures', 'gallery', 'media'],
    },
    {
      id: 'faq-management',
      title: 'FAQ Management',
      description: 'Create and manage frequently asked questions for your members.',
      icon: <HelpOutlineIcon />,
      getHref: (accountId) => `/account/${accountId}/league-faq/manage`,
      category: 'Content',
      keywords: ['faq', 'questions', 'answers', 'help'],
    },
    {
      id: 'handouts',
      title: 'Handouts',
      description: 'Upload and manage downloadable documents and handouts.',
      icon: <DescriptionIcon />,
      getHref: (accountId) => `/account/${accountId}/handouts/manage`,
      category: 'Content',
      keywords: ['handouts', 'documents', 'downloads', 'files', 'pdf'],
    },
    {
      id: 'information-messages',
      title: 'Information Messages',
      description: 'Create informational content pages for your account and teams.',
      icon: <InfoOutlinedIcon />,
      getHref: (accountId) => `/account/${accountId}/information-messages/manage`,
      category: 'Content',
      keywords: ['information', 'messages', 'content', 'pages'],
    },
    {
      id: 'social-media',
      title: 'Social Media',
      description: 'Connect and manage your social media platforms.',
      icon: <ShareIcon />,
      getHref: (accountId) => `/account/${accountId}/social-media`,
      category: 'Social Media',
      keywords: [
        'social',
        'facebook',
        'twitter',
        'instagram',
        'youtube',
        'bluesky',
        'discord',
        'platforms',
        'connect',
      ],
    },
    ...globalAdminItems,
  ];
}

export function getGolfAdminItems(): AdminSearchItem[] {
  return [
    ...baseAccountItems,
    ...baseSeasonItems,
    {
      id: 'golf-courses',
      title: 'Golf Courses',
      description: 'Manage golf courses and tee configurations.',
      icon: <GolfCourseIcon />,
      getHref: (accountId) => `/account/${accountId}/golf/courses`,
      category: 'Golf Courses',
      keywords: ['courses', 'tees', 'golf', 'clubs'],
    },
    ...globalAdminItems,
    {
      id: 'golf-course-management-global',
      title: 'Golf Course Management',
      description:
        'Create and manage golf courses. Only global admins can create courses from scratch.',
      icon: <SportsGolfIcon />,
      getHref: () => '/admin/golf/courses',
      category: 'Global Admin',
      keywords: ['golf', 'courses', 'create', 'global'],
      globalAdminOnly: true,
    },
  ];
}

export function searchAdminItems(
  items: AdminSearchItem[],
  query: string,
  isGlobalAdmin: boolean,
): AdminSearchItem[] {
  const filtered = isGlobalAdmin ? items : items.filter((item) => !item.globalAdminOnly);

  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();

  return filtered.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.keywords.some((k) => k.toLowerCase().includes(lowerQuery)),
  );
}

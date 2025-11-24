// Main Accounts Router for Draco Sports Manager
// Combines all account-related sub-routers for organized routing

import { Router } from 'express';
import accountsCoreRouter from './accounts-core.js';
import accountsContactsRouter from './accounts-contacts.js';
import contactMediaRouter from './contact-media.js';
import accountsResourcesRouter from './accounts-resources.js';
import accountsSettingsRouter from './accounts-settings.js';
import accountsAssetsRouter from './accounts-assets.js';
import accountsWorkoutsRouter from './accounts-workouts.js';
import accountsPlayerClassifiedsRouter from './accounts-player-classifieds.js';
import accountsSponsorsRouter from './accounts-sponsors.js';
import accountsPollsRouter from './accounts-polls.js';
import accountsPlayerSurveysRouter from './accounts-player-surveys.js';
import accountsHandoutsRouter from './accounts-handouts.js';
import accountsPhotoSubmissionsRouter from './accounts-photo-submissions.js';
import accountsPhotoGalleryRouter from './accounts-photo-gallery.js';
import accountsMemberBusinessRouter from './accounts-member-businesses.js';
import accountsHallOfFameRouter from './accounts-hall-of-fame.js';
import accountsLeagueFaqRouter from './accounts-league-faq.js';
import accountsAnnouncementsRouter from './accounts-announcements.js';
import accountsSocialRouter from './accounts-social.js';
import accountsDiscordRouter from './accounts-discord.js';
import accountsTwitterRouter from './accounts-twitter.js';
import accountsBlueskyRouter from './accounts-bluesky.js';

const router = Router({ mergeParams: true });

// Mount sub-routers with appropriate prefixes
// Contact and user management endpoints
router.use('/', accountsContactsRouter);

// Contact media endpoints (photos)
router.use('/:accountId/contacts', contactMediaRouter);

// Photo submission endpoints
router.use('/', accountsPhotoSubmissionsRouter);

// Photo gallery endpoints
router.use('/', accountsPhotoGalleryRouter);

// Hall of Fame endpoints
router.use('/', accountsHallOfFameRouter);

// Resources endpoints (teams, leagues, fields, umpires)
router.use('/', accountsResourcesRouter);

// Settings endpoints (URLs, Twitter, types, affiliations)
router.use('/', accountsSettingsRouter);

// Discord integration endpoints
router.use('/', accountsDiscordRouter);

// Twitter integration endpoints
router.use('/', accountsTwitterRouter);

// Bluesky integration endpoints
router.use('/', accountsBlueskyRouter);

// Assets endpoints (logo management)
router.use('/', accountsAssetsRouter);

// Workouts endpoints
router.use('/', accountsWorkoutsRouter);

// PlayerClassifieds endpoints
router.use('/:accountId/player-classifieds', accountsPlayerClassifiedsRouter);

// Core account operations (search, get, create, update, delete, my-accounts)
// Placed last so static routes like /types are matched before the generic /:accountId handler
router.use('/', accountsCoreRouter);

// Sponsor management endpoints
router.use('/', accountsSponsorsRouter);

// Member business endpoints
router.use('/', accountsMemberBusinessRouter);

// League FAQ endpoints
router.use('/', accountsLeagueFaqRouter);

// Poll management endpoints
router.use('/', accountsPollsRouter);

// Player survey endpoints
router.use('/', accountsPlayerSurveysRouter);

// Handout management endpoints
router.use('/', accountsHandoutsRouter);

// Announcement endpoints
router.use('/', accountsAnnouncementsRouter);

// Social feed endpoints
router.use('/', accountsSocialRouter);

export default router;

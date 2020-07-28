using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class LeagueHomeViewModel : AccountViewModel
    {
        public LeagueHomeViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            SeasonName = c.GetCurrentSeason(AccountId)?.Name;
            if (Account != null)
            {
                FirstYear = (Account.FirstYear == 0) ? DateTime.Now.Year : Account.FirstYear;
                YouTubeUserId = Account.YouTubeUserId; // "GoogleDevelopers";  // "lopPrnYe7Vgh6u_TYPFHmQ"; 
                if (!String.IsNullOrEmpty(YouTubeUserId))
                {
                    DefaultVideo = Account.DefaultVideo;
                    AutoPlayVideo = Account.AutoPlayVideo;
                }
            }
            IsPhotoAdmin = c.IsPhotoAdmin(accountId, Globals.GetCurrentUserId());
            ShowVideos = !String.IsNullOrEmpty(YouTubeUserId) || IsAdmin || IsPhotoAdmin;
            ShowPhotoGallery = IsAdmin || c.Db.PhotoGalleries.Where(pg => pg.AccountId == accountId).Any();

            ShowHandouts = IsAdmin || c.Db.AccountHandouts.Where(ah => ah.AccountId == accountId).Any();
            var now = DateTime.Now.AddDays(-1);

            ShowWorkouts = IsAdmin || c.Db.WorkoutAnnouncements.Where(wa => wa.AccountId == accountId && wa.WorkoutDate >= now).Any();
            ShowSponsors = IsAdmin || c.Db.Sponsors.Where(sp => sp.AccountId == accountId && sp.TeamId == 0).Any();
            ShowFAQMessage = c.Db.LeagueFaqs.Where(faq => faq.AccountId == accountId).Any();

            var showFacebookLike = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowFacebookLike"), out showFacebookLike);
            ShowFacebookLike = showFacebookLike;

            var showPlayerSurvey = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowPlayerSurvey"), out showPlayerSurvey);

            var hasPlayerInterview = (from pp in c.Db.PlayerProfiles
                                      join r in c.Db.Rosters on pp.PlayerId equals r.ContactId
                                      join co in c.Db.Contacts on r.ContactId equals co.Id
                                      join rs in c.Db.RosterSeasons on r.Id equals rs.PlayerId
                                      join ts in c.Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                                      join ls in c.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                      where co.CreatorAccountId == accountId && ls.SeasonId == CurrentSeasonId
                                      select pp).Distinct();

            ShowPlayerInterview = showPlayerSurvey && hasPlayerInterview.Any();

            var showHOF = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowHOF"), out showHOF);
            ShowHOF = showHOF && c.Db.Hofs.Where(hof => hof.AccountId == accountId).Any();

            var hasLeaderCats = c.Db.DisplayLeagueLeaders.Where(ll => ll.AccountId == accountId && ll.TeamId == 0).Any();
            ShowLeagueLeaders = IsAdmin || hasLeaderCats;
            ShowAnnouncements = true;
            ShowBirthdays = true;
            ShowWelcomeMessages = true;
            ShowScoreboard = true;
            ShowUserPoll = IsAdmin || c.Db.VoteQuestions.Where(vq => vq.AccountId == accountId && vq.Active).Any();

            UserTeams = c.GetCurrentUserTeams(accountId);

            string userId = Globals.GetCurrentUserId();
            if (!string.IsNullOrEmpty(userId))
            {
                OtherAccounts = (from contact in Controller.Db.Contacts
                                    join a in Controller.Db.Accounts on contact.CreatorAccountId equals a.Id
                                    where contact.UserId == userId && contact.CreatorAccountId != AccountId
                                    select a);
            }

            var showSponsorSpotlight = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowSponsorSpotlight"), out showSponsorSpotlight);
            ShowSponsorSpotlight = showSponsorSpotlight && Account.Sponsors.Any();

            ShowAffiliation = true;
            Affiliation = Account.Affiliation;
            TwitterEnabled = false;
            FacebookEnabled = false;
            VideosEnabled = true;

            RegisteredForAccount = AccountController.UserRegisteredForAccount(accountId);
        }

        public IQueryable<Account> OtherAccounts
        {
            get;
        }

        public bool RegisteredForAccount
        {
            get;
        }
        public bool ShowAffiliation
        {
            get;
        }
        public Affiliation Affiliation
        {
            get;
        }

        public Sponsor SponsorSpotlight
        {
            get;
        }

        public IQueryable<TeamSeason> UserTeams
        {
            get;
        }

        public bool ShowWelcomeMessages
        {
            get;
        }

        public bool ShowAnnouncements
        {
            get;
        }

        public bool ShowFacebookLike
        {
            get;
        }

        public bool ShowScoreboard
        {
            get;
            private set;
        }

        public bool ShowBirthdays
        {
            get;
        }

        public bool ShowHOF
        {
            get;
        }

        public bool ShowHandouts
        {
            get;
        }

        public bool ShowWorkouts
        {
            get;
        }

        public bool ShowUserPoll
        {
            get;
        }

        public bool ShowPlayerInterview
        {
            get;
        }

        public bool ShowLeagueLeaders
        {
            get;

        }

        public bool ShowSponsors
        {
            get;
        }

        public bool ShowSponsorSpotlight
        {
            get;
        }

        public bool ShowFAQMessage
        {
            get;
        }

        public bool TwitterEnabled
        {
            get;
        }

        public bool FacebookEnabled
        {
            get;
        }

        public bool VideosEnabled
        {
            get;
        }

        public bool ShowVideos
        {
            get;
        }

        public string DefaultVideo 
        { 
            get; 
        }

        public bool AutoPlayVideo 
        { 
            get; 
        }

        public bool ShowPhotoGallery
        {
            get;
        }

        public string SeasonName
        {
            get;
        }

        public string YouTubeUserId
        {
            get;
        }

        public bool IsPhotoAdmin
        {
            get; private set;
        }
    }
}

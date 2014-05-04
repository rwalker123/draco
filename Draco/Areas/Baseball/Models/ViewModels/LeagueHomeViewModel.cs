using System;
using System.Linq;
using System.Web.Mvc;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueHomeViewModel : AccountViewModel
    {
        public LeagueHomeViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            SeasonName = DataAccess.Seasons.GetCurrentSeasonName(AccountId);
            FirstYear = (Account.FirstYear == 0) ? DateTime.Now.Year.ToString() : Account.FirstYear.ToString();
            YouTubeUserId = Account.YouTubeUserId; // "GoogleDevelopers";  // "lopPrnYe7Vgh6u_TYPFHmQ"; 
            ShowVideos = false; // !String.IsNullOrEmpty(YouTubeUserId) || IsAdmin;
            ShowPhotoGallery = IsAdmin || DataAccess.PhotoGallery.GetPhotos(accountId).Any();

            ShowHandouts = IsAdmin || DataAccess.AccountHandouts.GetAccountHandouts(accountId).Any();
            ShowWorkouts = IsAdmin || DataAccess.Workouts.GetActiveWorkoutAnnouncements(accountId).Any();
            ShowHallOfFame = IsAdmin || DataAccess.HOFMembers.GetMembers(accountId).Any();
            ShowSponsors = IsAdmin || DataAccess.Sponsors.GetSponsors(accountId).Any();

            ShowPlayerInterview = true;
            ShowLeagueLeaders = true;
            ShowAnnouncements = true;
            ShowBirthdays = true;
            ShowWelcomeMessages = true;
            ShowScoreboard = true;

            UserTeams = DataAccess.Teams.GetCurrentUserTeams(accountId);

            TwitterEnabled = false;
            FacebookEnabled = false;
            VideosEnabled = false;
        }

        public IQueryable<ModelObjects.Team> UserTeams
        {
            get;
            private set;
        }

        public bool ShowWelcomeMessages
        {
            get;
            private set;
        }

        public bool ShowAnnouncements
        {
            get;
            private set;
        }

        public bool ShowScoreboard
        {
            get;
            private set;
        }

        public bool ShowBirthdays
        {
            get;
            private set;
        }

        public bool ShowHandouts
        {
            get;
            private set;
        }

        public bool ShowWorkouts
        {
            get;
            private set;
        }
        public bool ShowHallOfFame
        {
            get;
            private set;
        }

        public bool ShowPlayerInterview
        {
            get;
            private set;
        }

        public bool ShowLeagueLeaders
        {
            get;
            private set;

        }

        public bool ShowSponsors
        {
            get;
            private set;
        }

        public bool TwitterEnabled
        {
            get;
            private set;
        }

        public bool FacebookEnabled
        {
            get;
            private set;
        }

        public bool VideosEnabled
        {
            get;
            private set;
        }

        public bool ShowVideos
        {
            get;
            private set;
        }

        public bool ShowPhotoGallery
        {
            get;
            private set;
        }

        public string SeasonName
        {
            get;
            private set;
        }

        public string FirstYear
        {
            get;
            private set;
        }

        public string YouTubeUserId
        {
            get;
            private set;
        }
    }
}

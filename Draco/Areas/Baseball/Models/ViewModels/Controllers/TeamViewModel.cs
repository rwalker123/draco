using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamViewModel : AccountViewModel
    {
        public TeamViewModel(DBController c, long accountId, long id)
            : base(c, accountId)
        {
            Team = c.Db.TeamsSeasons.Find(id);

            SeasonName = c.Db.Seasons.Find(CurrentSeasonId)?.Name;

            var completedGames = c.GetTeamCompletedGames(Team.Id);
            TeamStanding = c.GetTeamStanding(Team.Id, completedGames);

            IsTeamAdmin = c.IsTeamAdmin(accountId, id);
            IsTeamPhotoAdmin = c.IsTeamPhotoAdmin(accountId, id);

            IsTeamMember = c.IsTeamMember(id);

            if (Team != null)
            {
                LeagueName = Team.LeagueSeason.League.Name;
                YouTubeUserId = Team.Team.YouTubeUserId; // "GoogleDevelopers";  // "lopPrnYe7Vgh6u_TYPFHmQ"; 
                if (!String.IsNullOrEmpty(YouTubeUserId))
                {
                    DefaultVideo = Team.Team.DefaultVideo;
                    AutoPlayVideo = Team.Team.AutoPlayVideo;
                }
            }
            ShowHandouts = IsTeamMember || IsAdmin || IsTeamAdmin;
            ShowWelcome = IsTeamMember || IsAdmin || IsTeamAdmin;
            ShowAnnouncements = IsTeamMember || IsAdmin || IsTeamAdmin;

            var hasTeamPhotos = c.Db.PhotoGalleryAlbums.Where(pga => pga.TeamId == id).SingleOrDefault()?.Photos.Any();
            
            ShowPhotoGallery = IsAdmin || IsTeamAdmin || IsTeamPhotoAdmin || hasTeamPhotos.GetValueOrDefault();
            ShowLeaders = true;
            ShowSponsors = IsAdmin || IsTeamAdmin || Team.Team.Sponsors.Any();
            ShowRoster = true;
            ShowScoreboard = true;

            var showPlayerSurvey = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowPlayerSurvey"), out showPlayerSurvey);
            ShowPlayerInterview = showPlayerSurvey && HasPlayerProfiles(accountId, id);

            ShowVideos = !String.IsNullOrEmpty(YouTubeUserId) || IsAdmin || IsTeamAdmin;
            VideosEnabled = true;
        }

        private bool HasPlayerProfiles(long accountId, long id)
        {
            return (from pp in Controller.Db.PlayerProfiles
                    join c in Controller.Db.Contacts on pp.PlayerId equals c.Id
                    join r in Controller.Db.Rosters on c.Id equals r.ContactId
                    join rs in Controller.Db.RosterSeasons on r.Id equals rs.PlayerId
                    join ts in Controller.Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                    join ls in Controller.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                    where r.AccountId == accountId && ls.SeasonId == CurrentSeasonId &&
                    ts.Id == id && !rs.Inactive
                    select pp).Any();
        }

        public TeamSeason Team { get; private set; }

        public String LeagueName { get; private set; }
        public bool ShowPhotoGallery { get; private set; }
        public bool ShowHandouts { get; private set; }
        public bool ShowWelcome { get; private set; }
        public bool ShowAnnouncements { get; private set; }
        public bool ShowLeaders { get; private set; }
        public bool ShowSponsors { get; private set; }
        public bool ShowRoster { get; private set; }
        public bool ShowScoreboard { get; private set; }
        public bool ShowPlayerInterview { get; private set; }

        public bool VideosEnabled { get; private set; }
        public bool ShowVideos { get; private set; }
        public string YouTubeUserId { get; private set; }
        public string DefaultVideo { get; private set; }
        public bool AutoPlayVideo { get; private set; }

        public bool IsTeamPhotoAdmin
        {
            get;
            private set;
        }

        public bool IsTeamAdmin
        {
            get; private set;
        }

        public bool IsTeamMember
        {
            get; private set;
        }

        public bool FromLeagueAccount
        {
            get { return AccountId != 0; }
        }

        public String SeasonName { get; private set; }

        public TeamStandingViewModel TeamStanding { get; private set; }
    }
}
using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamViewModel : AccountViewModel
    {
        public TeamViewModel(Controller c, long accountId, long id)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(id);

            SeasonName = DataAccess.Seasons.GetSeasonName(CurrentSeasonId);

            TeamStanding = DataAccess.Teams.GetTeamStanding(id);

            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, id);
            IsTeamPhotoAdmin = DataAccess.Teams.IsTeamPhotoAdmin(accountId, id);

            IsTeamMember = DataAccess.Teams.IsTeamMember(id);

            if (Team != null)
                LeagueName = DataAccess.Leagues.GetLeagueName(Team.LeagueId);

            ShowHandouts = IsTeamMember || IsAdmin || IsTeamAdmin;
            ShowWelcome = IsTeamMember || IsAdmin || IsTeamAdmin;
            ShowAnnouncements = IsTeamMember || IsAdmin || IsTeamAdmin;
            ShowPhotoGallery = IsAdmin || IsTeamAdmin || IsTeamPhotoAdmin || DataAccess.PhotoGallery.GetTeamPhotos(id).Any();
            ShowLeaders = true;
            ShowSponsors = IsAdmin || IsTeamAdmin || DataAccess.Sponsors.GetTeamSponsors(id).Any();
            ShowRoster = true;
            ShowScoreboard = true;

            var showPlayerSurvey = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowPlayerSurvey"), out showPlayerSurvey);
            ShowPlayerInterview = showPlayerSurvey && DataAccess.ProfileAdmin.GetTeamPlayersWithProfiles(accountId, id).Any();
        }

        public Team Team { get; private set; }

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

        public TeamStanding TeamStanding { get; private set; }
    }
}
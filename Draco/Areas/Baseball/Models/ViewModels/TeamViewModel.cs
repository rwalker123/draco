using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamViewModel : AccountViewModel
    {
        public TeamViewModel(Controller c, long accountId, long id)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(id);

            Handouts = DataAccess.TeamHandouts.GetTeamHandouts(Team.Id, 0);
            Sponsors = DataAccess.Sponsors.GetTeamSponsors(Team.Id, true);
            SeasonName = DataAccess.Seasons.GetSeasonName(CurrentSeasonId);
            ShowPhotoGallery = true;
        }

        public Team Team { get; private set; }

        public bool ShowPhotoGallery { get; private set; }
        public List<TeamHandout> Handouts { get; private set; }
        public List<LeagueNewsItem> Announcements { get; private set; }
        public List<Sponsor> Sponsors { get; private set; }

        public bool IsPhotoAdmin 
        {
            get { return IsAdmin; }
        }

        public bool IsTeamMember
        {
            get { return true; }
        }

        public bool FromLeagueAccount
        {
            get { return AccountId != 0; }
        }

        public String SeasonName { get; private set; }

    }
}
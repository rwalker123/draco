using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class RosterCardViewModel : AccountViewModel
    {
        public RosterCardViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (Team != null)
            {
                Players = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
                LeagueTeamName = DataAccess.Teams.GetLeagueTeamName(teamSeasonId);
            }
        }

        public String LeagueTeamName { get; set; }
        public Team Team { get; set; }
        public IQueryable<Player> Players { get; set; }
    }
}
using ModelObjects;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamAddressViewModel : AccountViewModel
    {
        public TeamAddressViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            Roster = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
        }

        public Team Team { get; private set; }
        public IQueryable<Player> Roster { get; private set; }
    }
}
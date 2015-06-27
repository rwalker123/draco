using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class HandoutsViewModel : AccountViewModel
    {
        public HandoutsViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert from team season to team id.
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
            {
                HasHandouts = false;
                return;
            }
            Handouts = DataAccess.TeamHandouts.GetTeamHandouts(team.TeamId).AsEnumerable();
            HasHandouts = Handouts.Any();

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            }
        }

        public HandoutsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            Handouts = DataAccess.AccountHandouts.GetAccountHandouts(accountId).AsEnumerable();
            HasHandouts = Handouts.Any();
        }

        public bool HasHandouts
        {
            get;
            private set;
        }

        public IEnumerable<Handout> Handouts
        {
            get;
            private set;
        }
    }
}
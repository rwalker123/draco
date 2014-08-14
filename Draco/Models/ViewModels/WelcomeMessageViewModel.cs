using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class WelcomeMessageViewModel : AccountViewModel
    {
        public WelcomeMessageViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert teamSeasonId to teamId
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return;

            HasMessage = DataAccess.Teams.GetWelcomeText(accountId, team.TeamId).Any();
            
            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            }            
        }

        public WelcomeMessageViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            HasMessage = Accounts.GetAccountWelcomeText(accountId).Any();
        }

        public bool HasMessage
        {
            get;
            private set;
        }
    }
}
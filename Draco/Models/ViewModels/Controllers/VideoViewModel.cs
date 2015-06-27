using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class VideoViewModel : AccountViewModel
    {
        public VideoViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert from team season to team id.
            var team = DataAccess.Teams.GetTeam(teamSeasonId);
            if (team == null)
                return;

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
            }
        }

        public VideoViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
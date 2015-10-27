using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class WelcomeMessageViewModel : AccountViewModel
    {
        public WelcomeMessageViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            // convert teamSeasonId to teamId
            var team = c.Db.TeamsSeasons.Find(teamSeasonId);
            if (team == null)
                return;

            HasMessage = c.Db.AccountWelcomes.Where(aw => aw.AccountId == accountId && aw.TeamId == team.TeamId).Any();

            // account admins and team admins.
            if (!IsAdmin)
            {
                IsAdmin = c.IsTeamAdmin(accountId, teamSeasonId);
            }            
        }

        public WelcomeMessageViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            HasMessage = c.Db.AccountWelcomes.Where(aw => aw.AccountId == accountId && aw.TeamId == 0).Any();
        }

        public bool HasMessage
        {
            get;
            private set;
        }
    }
}
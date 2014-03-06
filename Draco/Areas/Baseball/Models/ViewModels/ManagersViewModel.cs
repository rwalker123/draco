using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class ManagersViewModel : AccountViewModel
    {
        public ManagersViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;

            var isTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
        }

        public long TeamSeasonId { get; private set; }
        public bool isTeamAdmin { get; private set; }
    }
}

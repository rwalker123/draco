using SportsManager.ViewModels;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class RosterViewModel : AccountViewModel
    {
        public RosterViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);
        }

        public bool IsTeamAdmin { get; private set; }
    }
}

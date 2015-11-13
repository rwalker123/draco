using SportsManager.Controllers;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class ManagersViewModel : AccountViewModel
    {
        public ManagersViewModel(DBController c, long accountId, long teamSeasonId, bool isTeamMember)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;

            IsTeamMember = isTeamMember;
            IsTeamAdmin = c.IsTeamAdmin(accountId, teamSeasonId);

            var showLineupCard = false;
            bool.TryParse(c.GetAccountSetting(accountId, "ShowRosterCard"), out showLineupCard);
            ShowLineupCard = showLineupCard;
        }

        public long TeamSeasonId { get; private set; }
        public bool IsTeamAdmin { get; private set; }
        public bool ShowLineupCard { get; private set; }
        public bool IsTeamMember { get; private set; }
    }
}

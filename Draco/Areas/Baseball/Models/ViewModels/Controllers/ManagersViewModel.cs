using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class ManagersViewModel : AccountViewModel
    {
        public ManagersViewModel(Controller c, long accountId, long teamSeasonId, bool isTeamMember)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;

            IsTeamMember = isTeamMember;
            IsTeamAdmin = DataAccess.Teams.IsTeamAdmin(accountId, teamSeasonId);

            var showLineupCard = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "ShowRosterCard"), out showLineupCard);
            ShowLineupCard = showLineupCard;
        }

        public long TeamSeasonId { get; private set; }
        public bool IsTeamAdmin { get; private set; }
        public bool ShowLineupCard { get; private set; }
        public bool IsTeamMember { get; private set; }
    }
}

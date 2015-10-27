using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class SponsorsViewModel : AccountViewModel
    {
        public SponsorsViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            IsAdmin = IsAdmin || c.IsTeamAdmin(accountId, teamSeasonId);
        }

        public SponsorsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }
    }
}

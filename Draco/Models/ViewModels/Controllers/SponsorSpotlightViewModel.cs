using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class SponsorSpotlightViewModel : AccountViewModel
    {
        public SponsorSpotlightViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            TeamSeasonId = teamSeasonId;
        }

        public SponsorSpotlightViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }

        public long TeamSeasonId
        {
            get;
            set;
        }
    }
}
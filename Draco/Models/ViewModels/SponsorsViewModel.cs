using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class SponsorsViewModel : AccountViewModel
    {
        public SponsorsViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
        }

        public SponsorsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}

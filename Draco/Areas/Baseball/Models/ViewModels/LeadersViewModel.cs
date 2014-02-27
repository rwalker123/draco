using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeadersViewModel : AccountViewModel
    {
        public LeadersViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
        }

        public LeadersViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}

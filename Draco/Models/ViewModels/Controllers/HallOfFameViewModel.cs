using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class HallOfFameViewModel : AccountViewModel
    {
        public HallOfFameViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class HallOfFameViewModel : AccountViewModel
    {
        public HallOfFameViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
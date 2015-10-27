using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
    public class HOFOfDayViewModel : AccountViewModel
    {
        public HOFOfDayViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
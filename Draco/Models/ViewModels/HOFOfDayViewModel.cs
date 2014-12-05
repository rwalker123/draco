using System.Linq;

namespace SportsManager.ViewModels
{
    public class HOFOfDayViewModel : AccountViewModel
    {
        public HOFOfDayViewModel(System.Web.Mvc.Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
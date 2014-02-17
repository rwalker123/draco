using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class WorkoutsViewModel : AccountViewModel
    {
        public WorkoutsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }
    }
}
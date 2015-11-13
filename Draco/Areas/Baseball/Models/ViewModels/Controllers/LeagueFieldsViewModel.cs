using SportsManager.Controllers;
using SportsManager.ViewModels;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class LeagueFieldsViewModel : AccountViewModel
	{
		public LeagueFieldsViewModel(DBController c, long accountId)
            : base(c, accountId)
		{
		}
	}
}

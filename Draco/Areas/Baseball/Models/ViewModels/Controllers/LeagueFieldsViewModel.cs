using SportsManager.ViewModels;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
	public class LeagueFieldsViewModel : AccountViewModel
	{
		public LeagueFieldsViewModel(Controller c, long accountId)
            : base(c, accountId)
		{
		}
	}
}

using System.Web.Mvc;

namespace SportsManager.ViewModels
{
	public class LeagueSeasonsViewModel : AccountViewModel
	{
		public LeagueSeasonsViewModel(Controller c, long accountId)
            : base(c, accountId)
		{
		}
	}
}
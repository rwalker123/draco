using SportsManager.Controllers;

namespace SportsManager.ViewModels
{
	public class LeagueSeasonsViewModel : AccountViewModel
	{
		public LeagueSeasonsViewModel(DBController c, long accountId)
            : base(c, accountId)
		{
		}
	}
}
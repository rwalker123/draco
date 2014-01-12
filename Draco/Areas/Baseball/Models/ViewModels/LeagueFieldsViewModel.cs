
namespace SportsManager.Baseball.ViewModels
{
	public class LeagueFieldsViewModel
	{
		public LeagueFieldsViewModel(long accountId)
		{
			AccountId = accountId;
			AccountName = DataAccess.Accounts.GetAccountName(accountId);
		}

		public string AccountName { get; private set; }
		public long AccountId { get; private set; }

	}
}

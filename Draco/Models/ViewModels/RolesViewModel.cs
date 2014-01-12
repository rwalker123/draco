using Microsoft.AspNet.Identity;
using System.Security.Principal;
using System.Web;

namespace SportsManager.ViewModels
{
	public class RolesViewModel
	{
		public RolesViewModel(long accountId, long seasonId)
		{
			AccountId = accountId;
			SeasonId = seasonId;
            AccountType = DataAccess.Accounts.GetAccountType(AccountId);

			if (HttpContext.Current.User.Identity.IsAuthenticated)
				IsAccountAdmin = DataAccess.Accounts.IsAccountAdmin(accountId, HttpContext.Current.User.Identity.GetUserId());
			else
				IsAccountAdmin = false;
		}

		public long AccountId { get; private set; }
		public long SeasonId { get; private set; }
        public ModelObjects.AccountType AccountType { get; private set; }

		public bool IsAccountAdmin { get; private set; }
	}
}
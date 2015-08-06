using Microsoft.AspNet.Identity;
using SportsManager.Controllers;
using System.Web;

namespace SportsManager.ViewModels
{
    public class RolesViewModel
	{
		public RolesViewModel(DBController c, long accountId, long seasonId)
		{
			AccountId = accountId;
			SeasonId = seasonId;
            var account = c.Db.Accounts.Find(AccountId);
            AccountType = account.AccountType;
            if (HttpContext.Current.User.Identity.IsAuthenticated)
				IsAccountAdmin = c.IsAccountAdmin(accountId, HttpContext.Current.User.Identity.GetUserId());
			else
				IsAccountAdmin = false;
		}

		public long AccountId { get; private set; }
		public long SeasonId { get; private set; }
        public ModelObjects.AccountType AccountType { get; private set; }

		public bool IsAccountAdmin { get; private set; }
	}
}
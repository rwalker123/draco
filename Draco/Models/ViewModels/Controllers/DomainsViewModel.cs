using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Collections.Generic;

namespace SportsManager.ViewModels
{
    public class DomainsViewModel : AccountViewModel
    {
        public DomainsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            Account a = c.Db.Accounts.Find(accountId);
            AccountUrls = a.AccountsURL;
        }

        public IEnumerable<AccountURL> AccountUrls
        {
            get;
        }
    }
}
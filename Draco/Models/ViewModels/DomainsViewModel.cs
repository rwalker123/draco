using System;
using System.Collections.Generic;
using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.ViewModels
{
    public class DomainsViewModel : AccountViewModel
    {
        public DomainsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            Account a = DataAccess.Accounts.GetAccount(accountId);
            if (String.IsNullOrWhiteSpace(a.AccountURL))
                AccountUrls = new List<string>();
            else
                AccountUrls = new List<string>(a.AccountURL.Split(new char[] { ';' }));
        }

        public List<string> AccountUrls
        {
            get;
            private set;
        }
    }
}
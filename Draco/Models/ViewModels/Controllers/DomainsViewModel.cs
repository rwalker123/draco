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
            if (String.IsNullOrWhiteSpace(a.Url))
                AccountUrls = new List<string>();
            else
                AccountUrls = new List<string>(a.Url.Split(new char[] { ';' }));
        }

        public List<string> AccountUrls
        {
            get;
            private set;
        }
    }
}
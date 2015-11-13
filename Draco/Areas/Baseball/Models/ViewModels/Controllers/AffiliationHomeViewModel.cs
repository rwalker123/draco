using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class AffiliationHomeViewModel
    {
        DB db;

        public AffiliationHomeViewModel(DBController c, long affiliationId)
        {
            db = c.Db;

            Affiliation = db.Affiliations.Find(affiliationId);
            AffiliatedLeagues = Affiliation.Accounts;
        }

        public IEnumerable<Account> AffiliatedLeagues
        {
            get;
            private set;
        }

        public Affiliation Affiliation
        {
            get;
            private set;
        }
    }
}

using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class AffiliationHomeViewModel
    {
        DB db;

        public AffiliationHomeViewModel(DBController c, long affiliationId)
        {
            db = c.Db;

            Affiliation = (from a in db.Affiliations
                           where a.Id == affiliationId
                           select a).SingleOrDefault();

            AffiliatedLeagues = (from a in db.Accounts
                                 where a.AffiliationId == affiliationId
                                 select a);
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

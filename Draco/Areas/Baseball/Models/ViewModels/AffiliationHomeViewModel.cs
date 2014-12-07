using ModelObjects;
using System.Collections.Generic;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class AffiliationHomeViewModel
    {
        public AffiliationHomeViewModel(Controller c, long affiliationId)
        {
            Affiliation = DataAccess.Affiliations.GetAffiliation(affiliationId);
            AffiliatedLeagues = DataAccess.Affiliations.GetAffiliatedLeagues(affiliationId);
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

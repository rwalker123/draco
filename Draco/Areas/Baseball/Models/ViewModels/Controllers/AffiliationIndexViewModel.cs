using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class AffiliationIndexViewModel
    {
        DB db;

        public AffiliationIndexViewModel(DBController c, long affiliationId)
        {
            db = c.Db;

            Affiliations = (from a in db.Affiliations
                           select a);
        }

        public IEnumerable<Affiliation> Affiliations
        {
            get;
            private set;
        }
    }
}

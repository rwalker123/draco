using ModelObjects;
using SportsManager.Controllers;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class AffiliationIndexViewModel
    {
        DB db;

        public AffiliationIndexViewModel(DBController c)
        {
            db = c.Db;

            Affiliations = db.Affiliations;
        }

        public IEnumerable<Affiliation> Affiliations
        {
            get;
            private set;
        }
    }
}

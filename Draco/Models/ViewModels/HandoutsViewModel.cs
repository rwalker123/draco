using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class HandoutsViewModel : AccountViewModel
    {
        public HandoutsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            Handouts = DataAccess.AccountHandouts.GetAccountHandouts(accountId).AsEnumerable();
            HasHandouts = Handouts.Any();
        }

        public bool HasHandouts
        {
            get;
            private set;
        }

        public IEnumerable<Handout> Handouts
        {
            get;
            private set;
        }
    }
}
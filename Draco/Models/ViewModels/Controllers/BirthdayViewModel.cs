using DataAccess;
using ModelObjects;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
    public class BirthdayViewModel : AccountViewModel
    {
        public BirthdayViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
            Birthdays = TeamRoster.GetAllBirthdayBoys(accountId);
        }

        public IQueryable<ContactName> Birthdays { get; private set; }
    }
}
using ModelObjects;
using SportsManager.Controllers;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class PlayerSearchViewModel
    {
        public PlayerSearchViewModel(DBController c, long accountId, string lastNameSearchTerm)
        {
            AccountId = accountId;

            if (!String.IsNullOrWhiteSpace(lastNameSearchTerm))
                FoundPlayers = c.Db.Rosters.Where(r => r.Contact.CreatorAccountId == accountId && r.Contact.LastName.Contains(lastNameSearchTerm))
                    .OrderBy(r => r.Contact.LastName).ThenBy(r => r.Contact.FirstName).ThenBy(r => r.Contact.MiddleName).Select(r => r.Contact);
        }

        public long AccountId { get; set; }

        public IQueryable<Contact> FoundPlayers
        {
            get;
            private set;
        }
    }
}
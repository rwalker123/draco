using System;
using System.Collections.Generic;

namespace SportsManager.Baseball.ViewModels
{
    public class PlayerSearchViewModel
    {
        IEnumerable<ModelObjects.ContactName> m_names;

        public PlayerSearchViewModel(long accountId, string lastNameSearchTerm)
        {
            AccountId = accountId;

            if (String.IsNullOrWhiteSpace(lastNameSearchTerm))
                m_names = new List<ModelObjects.ContactName>();
            else
                m_names = DataAccess.TeamRoster.FindPlayers(accountId, lastNameSearchTerm);
        }

        public long AccountId { get; set; }

        public IEnumerable<ModelObjects.ContactName> FoundPlayers
        {
            get
            {
                return m_names;
            }
        }

        public long SeasonId { get; set; }
    }
}
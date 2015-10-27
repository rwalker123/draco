using System;

namespace ModelObjects
{
    public class PlayersWantedClassified
    {
        public long Id { get; set; } // Id (Primary key)
        public long AccountId { get; set; } // AccountId
        public DateTime DateCreated { get; set; } // DateCreated
        public long CreatedByContactId { get; set; } // CreatedByContactId
        public string TeamEventName { get; set; } // TeamEventName
        public string Description { get; set; } // Description
        public string PositionsNeeded { get; set; } // PositionsNeeded

        // Foreign keys
        public virtual Account Account { get; set; } // FK_PlayersWantedClassified_Accounts
        public virtual Contact Contact { get; set; } // FK_PlayersWantedClassified_Contacts
    }
}
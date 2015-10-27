using System;

namespace ModelObjects
{
    public class TeamsWantedClassified
    {
        public long Id { get; set; } // Id (Primary key)
        public long AccountId { get; set; } // AccountId
        public DateTime DateCreated { get; set; } // DateCreated
        public string Name { get; set; } // Name
        public string EMail { get; set; } // EMail
        public string Phone { get; set; } // Phone
        public string Experience { get; set; } // Experience
        public string PositionsPlayed { get; set; } // PositionsPlayed
        public Guid AccessCode { get; set; } // AccessCode
        public DateTime BirthDate { get; set; } // BirthDate

        // Foreign keys
        public virtual Account Account { get; set; } // FK_TeamsWantedClassified_Accounts
    }
}

namespace ModelObjects
{
    public class PlayerSeasonAffiliationDue
    {
        public long PlayerId { get; set; } // PlayerId (Primary key)
        public long SeasonId { get; set; } // SeasonId (Primary key)
        public string AffiliationDuesPaid { get; set; } // AffiliationDuesPaid

        // Foreign keys
        public virtual Player Roster { get; set; } // FK_PlayerSeasonAffiliationDues_Roster
        public virtual Season Season { get; set; } // FK_PlayerSeasonAffiliationDues_Season
    }
}


namespace ModelObjects
{
    public class CurrentSeason
    {
        public long SeasonId { get; set; } // SeasonId
        public long AccountId { get; set; } // AccountId (Primary key)

        // Foreign keys
        public virtual Account Account { get; set; } // FK_CurrentSeason_Accounts
    }
}

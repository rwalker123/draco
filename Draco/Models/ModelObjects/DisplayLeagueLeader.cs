
namespace ModelObjects
{
    public class DisplayLeagueLeader
    {
        public string FieldName { get; set; } // FieldName (Primary key)
        public long AccountId { get; set; } // AccountId (Primary key)
        public long TeamId { get; set; } // TeamId (Primary key)
        public bool IsBatLeader { get; set; } // IsBatLeader (Primary key)
    }
}
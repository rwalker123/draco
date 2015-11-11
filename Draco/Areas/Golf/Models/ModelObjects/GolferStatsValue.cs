using ModelObjects;

namespace SportsManager.Models
{
    public class GolferStatsValue
    {
        public long Id { get; set; } // Id (Primary key)
        public long ScoreId { get; set; } // ScoreId
        public long ContactId { get; set; } // ContactId
        public int HoleNo { get; set; } // HoleNo
        public string Value { get; set; } // Value

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_GolferStatsValue_Contacts
        public virtual GolfScore GolfScore { get; set; } // FK_GolferStatsValue_GolfScore
    }
}
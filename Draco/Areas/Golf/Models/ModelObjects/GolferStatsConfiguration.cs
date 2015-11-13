using ModelObjects;

namespace SportsManager.Golf.Models
{
    public class GolferStatsConfiguration
    {
        public long Id { get; set; } // Id (Primary key)
        public long ContactId { get; set; } // ContactId
        public long StatId { get; set; } // StatId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_GolferStatsConfiguration_Contacts
        public virtual GolfStatDef GolfStatDef { get; set; } // FK_GolferStatsConfiguration_GolfStatDef
    }
}
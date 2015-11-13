using ModelObjects;
using System.Collections.Generic;

namespace SportsManager.Golf.Models
{
    public class GolfRoster
    {
        public long Id { get; set; } // Id (Primary key)
        public long ContactId { get; set; } // ContactId
        public long TeamSeasonId { get; set; } // TeamSeasonId
        public bool IsActive { get; set; } // IsActive
        public double? InitialDifferential { get; set; } // InitialDifferential
        public bool IsSub { get; set; } // IsSub
        public long? SubSeasonId { get; set; } // SubSeasonId

        // Reverse navigation
        public virtual ICollection<GolfMatchScore> GolfMatchScores { get; set; } // Many to many mapping

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_GolfRoster_Contacts
        public virtual TeamSeason TeamsSeason { get; set; } // FK_GolfRoster_TeamsSeason

        public GolfRoster()
        {
            IsSub = false;
            GolfMatchScores = new List<GolfMatchScore>();
        }
    }
}
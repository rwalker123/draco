
using ModelObjects;

namespace SportsManager.Models
{
    public class GolfMatchScore
    {
        public long MatchId { get; set; } // MatchId (Primary key)
        public long TeamId { get; set; } // TeamId (Primary key)
        public long PlayerId { get; set; } // PlayerId (Primary key)
        public long ScoreId { get; set; } // ScoreId (Primary key)

        // Foreign keys
        public virtual GolfMatch GolfMatch { get; set; } // FK_GolfMatchScores_GolfMatch
        public virtual GolfRoster GolfRoster { get; set; } // FK_GolfMatchScores_GolfRoster
        public virtual GolfScore GolfScore { get; set; } // FK_GolfMatchScores_GolfScore
        public virtual TeamSeason TeamsSeason { get; set; } // FK_GolfMatchScores_TeamsSeason
    }
}

using ModelObjects;
using System;
using System.Collections.Generic;

namespace SportsManager.Golf.Models
{
	public class GolfMatch
	{
        public long Id { get; set; } // Id (Primary key)
        public long Team1 { get; set; } // Team1
        public long Team2 { get; set; } // Team2
        public long LeagueId { get; set; } // LeagueId
        public DateTime MatchDate { get; set; } // MatchDate
        public DateTime MatchTime { get; set; } // MatchTime
        public long? CourseId { get; set; } // CourseId
        public int MatchStatus { get; set; } // MatchStatus
        public int MatchType { get; set; } // MatchType
        public string Comment { get; set; } // Comment

        // Reverse navigation
        public virtual ICollection<GolfMatchScore> GolfMatchScores { get; set; } // Many to many mapping

        // Foreign keys
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfMatch_GolfCourse
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_GolfMatch_LeagueSeason
        public virtual TeamSeason TeamsSeason_Team1 { get; set; } // FK_GolfMatch_TeamsSeason
        public virtual TeamSeason TeamsSeason_Team2 { get; set; } // FK_GolfMatch_Teams

        public GolfMatch()
        {
            CourseId = 0;
            GolfMatchScores = new List<GolfMatchScore>();
        }
    }
}
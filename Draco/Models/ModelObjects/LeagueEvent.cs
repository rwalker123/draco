using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for LeagueEvent
    /// </summary>
    public class LeagueEvent
    {
        public long Id { get; set; } // id (Primary key)
        public DateTime EventDate { get; set; } // EventDate
        public string Description { get; set; } // Description
        public long LeagueSeasonId { get; set; } // LeagueSeasonId

        // Foreign keys
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_LeagueEvents_LeagueSeason
    }
}
using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayoffSetup
/// </summary>
	public class PlayoffSetup
	{
        public long Id { get; set; } // id (Primary key)
        public long LeagueSeasonId { get; set; } // LeagueSeasonId
        public int NumTeams { get; set; } // NumTeams
        public string Description { get; set; } // Description
        public bool Active { get; set; } // Active

        // Reverse navigation
        public virtual ICollection<PlayoffBracket> PlayoffBrackets { get; set; } // PlayoffBracket.FK_PlayoffBracket_PlayoffSetup
        public virtual ICollection<PlayoffSeed> PlayoffSeeds { get; set; } // PlayoffSeeds.FK_PlayoffSeeds_PlayoffSetup

        // Foreign keys
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_PlayoffSetup_LeagueSeason

        public PlayoffSetup()
        {
            PlayoffBrackets = new List<PlayoffBracket>();
            PlayoffSeeds = new List<PlayoffSeed>();
        }
	}
}
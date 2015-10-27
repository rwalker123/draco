using System;
using System.Collections.Generic;

namespace ModelObjects
{
    public class PlayerSeason
    {
        public long Id { get; set; } // Id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long TeamSeasonId { get; set; } // TeamSeasonId
        public int PlayerNumber { get; set; } // PlayerNumber
        public bool Inactive { get; set; } // Inactive
        public bool SubmittedWaiver { get; set; } // SubmittedWaiver
        public DateTime? DateAdded { get; set; } // DateAdded

        // Reverse navigation
        public virtual ICollection<GameBatStats> Batstatsums { get; set; } // batstatsum.FK_batstatsum_RosterSeason
        //public virtual ICollection<Fieldstatsum> Fieldstatsums { get; set; } // fieldstatsum.FK_fieldstatsum_RosterSeason
        public virtual ICollection<GameEjection> GameEjections { get; set; } // GameEjections.FK_GameEjections_RosterSeason
        public virtual ICollection<GamePitchStats> Pitchstatsums { get; set; } // pitchstatsum.FK_pitchstatsum_RosterSeason
        public virtual ICollection<PlayerRecap> PlayerRecaps { get; set; } // Many to many mapping

        // Foreign keys
        public virtual Player Roster { get; set; } // FK_RosterSeason_Roster
        public virtual TeamSeason TeamSeason { get; set; } // FK_RosterSeason_TeamSeason
        
        public PlayerSeason()
        {
            Batstatsums = new List<GameBatStats>();
            //Fieldstatsums = new List<Fieldstatsum>();
            GameEjections = new List<GameEjection>();
            Pitchstatsums = new List<GamePitchStats>();
            PlayerRecaps = new List<PlayerRecap>();
        }
    }
}

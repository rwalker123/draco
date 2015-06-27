using System.Collections.Generic;

namespace ModelObjects
{
    public class TeamSeason
    {
        public long Id { get; set; } // id (Primary key)
        public long LeagueSeasonId { get; set; } // LeagueSeasonId
        public long TeamId { get; set; } // TeamId
        public string Name { get; set; } // Name
        public long DivisionSeasonId { get; set; } // DivisionSeasonId

        // Reverse navigation
        public virtual ICollection<GameBatStats> Batstatsums { get; set; } // batstatsum.FK_batstatsum_TeamsSeason
        //public virtual ICollection<Fieldstatsum> Fieldstatsums { get; set; } // fieldstatsum.FK_fieldstatsum_TeamsSeason
        public virtual ICollection<GameRecap> GameRecaps { get; set; } // Many to many mapping
        //public virtual ICollection<GolfMatch> GolfMatches_Team1 { get; set; } // GolfMatch.FK_GolfMatch_TeamsSeason
        //public virtual ICollection<GolfMatch> GolfMatches_Team2 { get; set; } // GolfMatch.FK_GolfMatch_Teams
        //public virtual ICollection<GolfMatchScore> GolfMatchScores { get; set; } // Many to many mapping
        //public virtual ICollection<GolfRoster> GolfRosters { get; set; } // GolfRoster.FK_GolfRoster_TeamsSeason
        public virtual ICollection<GamePitchStats> Pitchstatsums { get; set; } // pitchstatsum.FK_pitchstatsum_TeamsSeason
        public virtual ICollection<PlayerRecap> PlayerRecaps { get; set; } // Many to many mapping
        public virtual ICollection<TeamManager> TeamSeasonManagers { get; set; } // TeamSeasonManager.FK_TeamSeasonManager_TeamsSeason
        public virtual ICollection<PlayerSeason> Roster { get; set; } // PlayerSeason.FK_RosterSeason_TeamSeason

        // Foreign keys
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_TeamsSeason_LeagueSeason
        public virtual Team Team { get; set; } // FK_TeamsSeason_Teams
        public virtual DivisionSeason DivisionSeason { get; set; } // FK_TeamsSeason_DivisionSeason
        
        public TeamSeason()
        {
            Batstatsums = new List<GameBatStats>();
            //Fieldstatsums = new List<Fieldstatsum>();
            GameRecaps = new List<GameRecap>();
            //GolfMatches_Team1 = new List<GolfMatch>();
            //GolfMatches_Team2 = new List<GolfMatch>();
            //GolfMatchScores = new List<GolfMatchScore>();
            //GolfRosters = new List<GolfRoster>();
            Pitchstatsums = new List<GamePitchStats>();
            PlayerRecaps = new List<PlayerRecap>();
            TeamSeasonManagers = new List<TeamManager>();
            Roster = new List<PlayerSeason>();
        }
    }
}

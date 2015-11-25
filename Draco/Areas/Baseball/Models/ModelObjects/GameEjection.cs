
namespace ModelObjects
{
    /// <summary>
    /// Summary description for GameEjection
    /// </summary>
    public class GameEjection
    {
        public long Id { get; set; } // id (Primary key)
        public long LeagueSeasonId { get; set; } // leagueSeasonId
        public long GameId { get; set; } // gameId
        public long PlayerSeasonId { get; set; } // playerSeasonId
        public long UmpireId { get; set; } // umpireId
        public string Comments { get; set; } // comments

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_GameEjections_LeagueSchedule
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_GameEjections_LeagueSeason
        public virtual Umpire LeagueUmpire { get; set; } // FK_GameEjections_LeagueUmpires
        public virtual PlayerSeason RosterSeason { get; set; } // FK_GameEjections_RosterSeason
    }
}
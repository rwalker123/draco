
namespace ModelObjects
{
    public partial class PlayerRecap
    {
        public long PlayerId { get; set; } // PlayerId (Primary key)
        public long TeamId { get; set; } // TeamId (Primary key)
        public long GameId { get; set; } // GameId (Primary key)

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_PlayerRecap_LeagueSchedule
        public virtual PlayerSeason RosterSeason { get; set; } // FK_PlayerRecap_RosterSeason
        public virtual TeamSeason TeamsSeason { get; set; } // FK_PlayerRecap_TeamsSeason
    }
}
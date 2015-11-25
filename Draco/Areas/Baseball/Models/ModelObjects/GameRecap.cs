
namespace ModelObjects
{

	/// <summary>
	/// Summary description for GameRecap
	/// </summary>
	public class GameRecap
	{
        public long GameId { get; set; } // GameId (Primary key)
        public long TeamId { get; set; } // TeamId (Primary key)
        public string Recap { get; set; } // Recap

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_GameRecap_LeagueSchedule
        public virtual TeamSeason TeamsSeason { get; set; } // FK_GameRecap_TeamsSeason
    }
}
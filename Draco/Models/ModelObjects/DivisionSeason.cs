
using System.Collections.Generic;
namespace ModelObjects
{
/// <summary>
/// Summary description for Division
/// </summary>
	public class DivisionSeason
	{
        public long Id { get; set; } // id (Primary key)
        public long DivisionId { get; set; } // DivisionId
        public long LeagueSeasonId { get; set; } // LeagueSeasonId
        public int Priority { get; set; } // Priority

        // Foreign keys
        public virtual DivisionDefinition DivisionDef { get; set; } // FK_DivisionSeason_DivisionDefs
        public virtual LeagueSeason LeagueSeason { get; set; } // FK_DivisionSeason_LeagueSeason
        public virtual ICollection<TeamSeason> TeamsSeasons { get; set; } // FK_TeamsSeason_DivisionSeason

        public DivisionSeason()
        {
            TeamsSeason = new List<TeamSeason>();
        }
    }
}
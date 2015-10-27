using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for League
/// </summary>
	public class LeagueDefinition
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Name { get; set; } // Name

        // Reverse navigation
        public virtual ICollection<LeagueSeason> LeagueSeasons { get; set; } // LeagueSeason.FK_LeagueSeason_League

        // Foreign keys
        public virtual Account Account { get; set; } // FK_League_Accounts

        public LeagueDefinition()
        {
            LeagueSeasons = new List<LeagueSeason>();
        }
	}
}

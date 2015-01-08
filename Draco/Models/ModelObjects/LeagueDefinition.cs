using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
/// <summary>
/// Summary description for League
/// </summary>
	public class LeagueDefinition
	{
		public LeagueDefinition()
		{
            LeagueSeasons = new Collection<LeagueSeason>();
		}

        public long Id
        {
            get;
            set;
        }
	
		public long AccountId
        {
            get;
            set;
        }

		public string Name
        {
            get;
            set;
        }

        public virtual ICollection<LeagueSeason> LeagueSeasons;
	}
}

using System;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Season
	/// </summary>
	public class Season : IComparable
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Name { get; set; } // Name

        // Reverse navigation
        public virtual ICollection<LeagueSeason> LeagueSeasons { get; set; } // LeagueSeason.FK_LeagueSeason_Season
        public virtual ICollection<PlayerSeasonAffiliationDue> PlayerSeasonAffiliationDues { get; set; } // Many to many mapping

        // Foreign keys
        public virtual Account Account { get; set; } // FK_Season_Accounts

        public Season()
        {
            LeagueSeasons = new List<LeagueSeason>();
            PlayerSeasonAffiliationDues = new List<PlayerSeasonAffiliationDue>();
        }

		public int CompareTo(Object o)
		{
			Season s = (Season)o;

			return Name.CompareTo(s.Name);
		}
	}
}
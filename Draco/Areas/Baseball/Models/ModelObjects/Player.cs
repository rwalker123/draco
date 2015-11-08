using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Player
	/// </summary>
	public class Player
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public long ContactId { get; set; } // ContactId
        public bool SubmittedDriversLicense { get; set; } // SubmittedDriversLicense

        // Reverse navigation
        public virtual ICollection<PlayerSeasonAffiliationDue> PlayerSeasonAffiliationDues { get; set; } // Many to many mapping
        public virtual ICollection<PlayerSeason> RosterSeasons { get; set; } // RosterSeason.FK_RosterSeason_Roster

        // Foreign keys
        public virtual Account Account { get; set; } // FK_Roster_Accounts
        public virtual Contact Contact { get; set; } // FK_Roster_Contacts
        
        public Player()
        {
            PlayerSeasonAffiliationDues = new List<PlayerSeasonAffiliationDue>();
            RosterSeasons = new List<PlayerSeason>();
        }
	}
}
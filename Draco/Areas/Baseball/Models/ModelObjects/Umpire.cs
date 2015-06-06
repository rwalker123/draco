using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for TeamManager
	/// </summary>
	public class Umpire
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public long ContactId { get; set; } // ContactId

        // Reverse navigation
        public virtual ICollection<GameEjection> GameEjections { get; set; } // GameEjections.FK_GameEjections_LeagueUmpires

        // Foreign keys
        public virtual Account Account { get; set; } // FK_LeagueUmpires_Accounts
        public virtual Contact Contact { get; set; } // FK_LeagueUmpires_Contacts
        
        public Umpire()
        {
            GameEjections = new List<GameEjection>();
        }
	}
}
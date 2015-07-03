
namespace ModelObjects
{
/// <summary>
/// Summary description for TeamManager
/// </summary>
	public class TeamManager 
	{
        public long Id { get; set; } // id (Primary key)
        public long TeamSeasonId { get; set; } // TeamSeasonId
        public long ContactId { get; set; } // ContactId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_TeamSeasonManager_Contacts
        public virtual TeamSeason TeamsSeason { get; set; } // FK_TeamSeasonManager_TeamsSeason
    }
}
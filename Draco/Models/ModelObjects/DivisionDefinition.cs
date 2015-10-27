using System.Collections.Generic;

namespace ModelObjects
{
/// <summary>
/// Summary description for Division
/// </summary>
	public class DivisionDefinition
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Name { get; set; } // Name

        // Reverse navigation
        public virtual ICollection<DivisionSeason> DivisionSeasons { get; set; } // DivisionSeason.FK_DivisionSeason_DivisionDefs

        // Foreign keys
        public virtual Account Account { get; set; } // FK_DivisionDefs_Accounts
        
        public DivisionDefinition()
        {
            DivisionSeasons = new List<DivisionSeason>();
        }
	}
}
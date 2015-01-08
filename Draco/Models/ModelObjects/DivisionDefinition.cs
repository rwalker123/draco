using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
/// <summary>
/// Summary description for Division
/// </summary>
	public class DivisionDefinition
	{
		public DivisionDefinition()
		{
            DivisionSeasons = new Collection<DivisionSeason>();
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

        public virtual ICollection<DivisionSeason> DivisionSeasons { get; set; }
	}
}
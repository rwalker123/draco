using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for Division
/// </summary>
	public class DivisionSeason
	{
		public DivisionSeason()
		{
		}

        public long Id
        {
            get;
            set;
        }
	
		public long DivisionId
		{
            get;
            set;
        }

        public long LeagueSeasonId
        {
            get;
            set;
        }

        public int Priority
		{
            get;
            set;
        }

        public virtual DivisionDefinition DivisionDefinition;
    }
}
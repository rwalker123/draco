using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for Division
/// </summary>
	public class Division : IComparable
	{
		public Division()
		{
		}

		public Division(long divisionId, long leagueId, string divisionName, int priority, long accountId)
		{
			AccountId = accountId;
			LeagueId = leagueId;
			Id = divisionId;
			Name = divisionName;
			Priority = priority;
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

		public long LeagueId
		{
            get;
            set;
        }
	
		public string Name
		{
            get;
            set;
        }
	
		public int Priority
		{
            get;
            set;
        }
	
		public int CompareTo(Object o)
		{
			Division d = (Division)o;

			if ( Priority > d.Priority )
				return 1;
			else if ( Priority < d.Priority )
				return -1;
			else 
				return 0;
		}
	}
}
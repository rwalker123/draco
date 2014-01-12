using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for League
/// </summary>
	public class League
	{
		public League()
		{
		}

		public League(long leagueId, string leagueName, long accountId)
		{
			AccountId = accountId;
			Id = leagueId;
			Name = leagueName;
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
	}
}

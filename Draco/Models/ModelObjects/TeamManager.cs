using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for TeamManager
/// </summary>
	public class TeamManager : ContactName
	{
		public TeamManager()
		{
		}

		public TeamManager(long contactId, string firstName, string lastName, string middleName, string photoUrl,
                            long mgrSeasonId, long teamId, long accountId, DateTime birthDate)
            : base(contactId, firstName, lastName, middleName, photoUrl, birthDate)
		{
			MgrSeasonId = mgrSeasonId;
			TeamId = teamId;
		    AccountId = accountId;
		}

		public long MgrSeasonId { get; set; }
		public long TeamId { get; set; }
		public long AccountId { get; set; }

        public String Email { get; set; }
        public String Phone1 { get; set; }
        public String Phone2 { get; set; }
        public String Phone3 { get; set; }
    }
}
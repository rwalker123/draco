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
                            long mgrSeasonId, long teamId, long accountId)
            : base(contactId, firstName, lastName, middleName, photoUrl)
		{
			MgrSeasonId = mgrSeasonId;
			TeamId = teamId;
		    AccountId = accountId;
		}

		public long MgrSeasonId { get; set; }
		public long TeamId { get; set; }
		public long AccountId { get; set; }
	}
}
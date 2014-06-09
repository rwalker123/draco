using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for TeamManager
	/// </summary>
	public class Umpire : ContactName
	{
		public Umpire()
		{
		}

		public Umpire(long id, long accountId)
		{
            Id = id;
            AccountId = accountId;
		}

		public long AccountId { get; set; }
        public long ContactId { get; set; }
        public String FullName
        {
            get
            {
                string fullName = LastName + ", " + FirstName + " " + MiddleName;
                return fullName.Trim();
            }
        }
	}
}
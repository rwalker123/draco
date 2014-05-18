using System;
using System.Configuration;

namespace ModelObjects
{
/// <summary>
/// Summary description for HOFMember
/// </summary>
	public class HOFMember
	{
		public HOFMember()
		{
		}
	
		public HOFMember(long id, int yearInducted, string bio, long accountId)
		{
			Id = id;
			AccountId = accountId;
			YearInducted = yearInducted;
		    Biography = bio;
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

        public int YearInducted
        {
            get;
            set;
        }

        public string Biography
        {
            get;
            set;
        }

        public string PhotoURL
        {
            get;
            set;
        }
	}
}
using SportsManager.Models.Utils;
using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Account
	/// </summary>
	public class Account
	{
		public enum AccountType
		{
			Baseball = 1,
			Bowling = 2,
			Golf = 3,
			FitnessClub = 4,
			GolfIndividual = 5
		}


		private string m_smallLogoName = "SmallLogo.png";
		private string m_largeLogoName = "LargeLogo.png";

		public Account()
		{
		}

		public Account(long id, string accountName, string accountURL, long ownerContactId,
						int firstYear, long accountTypeId, long affiliationId, string timeZoneId)
		{
			Id = id;
			AccountName = accountName;
			AccountURL = accountURL;
			FirstYear = firstYear;
			OwnerContactId = ownerContactId;

			AccountTypeId = accountTypeId;
			AffiliationId = affiliationId;

			if (String.IsNullOrEmpty(timeZoneId))
				TimeZoneId = "0";
			else
				TimeZoneId = timeZoneId;
		}

		public long Id { get; set; }
		public long AccountTypeId { get; set; }
		public long AffiliationId { get; set; }
		public string AccountName { get; set; }
		public string AccountURL { get; set; }
		public int FirstYear { get; set; }
		public string TimeZoneId { get; set; }
		public long OwnerContactId { get; set; }
        public string YouTubeUserId { get; set; }
        public string TwitterAccountName { get; set; }
        public string DefaultVideo { get; set; }
        public bool AutoPlayVideo { get; set; }

		public TimeZoneInfo TimeZoneInfo
		{
			get
			{
				try
				{
					if (String.IsNullOrEmpty(TimeZoneId) ||
						TimeZoneId == "0")
						return null;
					else
						return TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);
				}
				catch
				{
					return null;
				}
			}
		}

		public string TimeZoneDisplayName
		{
			get
			{
				TimeZoneInfo timeZoneInfo = TimeZoneInfo;

				if (timeZoneInfo != null)
					return timeZoneInfo.DisplayName;

				return string.Empty;
			}
		}

        public bool HasLargeLogo
        {
            get
            {
                return Storage.Provider.Exists(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_largeLogoName);
            }
        }
		public string LargeLogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_largeLogoName);
			}
		}

		public string SmallLogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + Id + "/Logo/" + m_smallLogoName);
			}
		}
	}
}
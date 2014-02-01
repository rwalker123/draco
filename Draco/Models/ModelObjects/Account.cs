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

        private string LogoUploadDir
        {
            get { return Globals.UploadDirRoot + AccountHomeController + "/" + Id.ToString() + "/Logo/"; }
        }

		public string AccountConfigurationURL
		{
			get
			{
				switch (AccountTypeId)
				{
					case (long)AccountType.Baseball:
						return @"~\AccountTypes\Baseball\League\Adult\Configuration\";
					case (long)AccountType.Bowling:
						return @"~\AccountTypes\Bowling\League\Configuration\";
					case (long)AccountType.Golf:
						return @"~\AccountTypes\Golf\League\Configuration\";
					case (long)AccountType.FitnessClub:
						return @"~\AccountTypes\FitnessClub\Configuration\";
					case (long)AccountType.GolfIndividual:
						return @"~\AccountTypes\Golf\Individual\Configuration\";
				}

				return String.Empty;
			}
		}

		public string AccountHomeController
		{
			get
			{
				switch (AccountTypeId)
				{
					case (long)AccountType.Baseball:
						return "League";
					case (long)AccountType.Bowling:
						return "League";
					case (long)AccountType.Golf:
						return "League";
					case (long)AccountType.FitnessClub:
						return "";
					case (long)AccountType.GolfIndividual:
						return "Individual";
				}

				return String.Empty;
			}
		}

		public string AccountArea
		{
			get
			{
				switch (AccountTypeId)
				{
					case (long)AccountType.Baseball:
						return "Baseball";
					case (long)AccountType.Bowling:
						return "Bowling";
					case (long)AccountType.Golf:
						return "Golf";
					case (long)AccountType.FitnessClub:
						return "FitnessClub";
					case (long)AccountType.GolfIndividual:
						return "Golf";
				}

				return String.Empty;
			}
		}

		public string AccountConfigurationDirectory
		{
			get
			{
				return System.Web.HttpContext.Current.Server.MapPath(AccountConfigurationURL);
			}
		}


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

		public string LargeLogoURL
		{
			get
			{
				if (LargeLogoFile != null)
                    return LogoUploadDir + m_largeLogoName;
				else
					return null;
			}
		}

		public string LargeLogoURLName
		{
			get
			{
                return LogoUploadDir + m_largeLogoName;
			}
		}

		public string LargeLogoFile
		{
			get
			{
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(LogoUploadDir + m_largeLogoName);
				System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
				if (fileInfo.Exists)
					return fileInfo.FullName;
				else
					return null;
			}
		}

		public string SmallLogoURL
		{
			get
			{
				if (SmallLogoFile != null)
                    return LogoUploadDir + m_smallLogoName;
				else
					return null;
			}
		}

		public string SmallLogoURLName
		{
			get
			{
                return LogoUploadDir + m_smallLogoName;
			}
		}

		public string SmallLogoFile
		{
			get
			{
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(LogoUploadDir + m_smallLogoName);
				System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
				if (fileInfo.Exists)
					return fileInfo.FullName;
				else
					return null;
			}
		}
	}
}
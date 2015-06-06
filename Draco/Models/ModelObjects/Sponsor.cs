using SportsManager.Models.Utils;

namespace ModelObjects
{
/// <summary>
/// Summary description for Sponsor
/// </summary>
	public class Sponsor
	{
		private string m_logoName = "SponsorLogo.png";

        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Name { get; set; } // Name
        public string StreetAddress { get; set; } // StreetAddress
        public string CityStateZip { get; set; } // CityStateZip
        public string Description { get; set; } // Description
        public string EMail { get; set; } // EMail
        public string Phone { get; set; } // Phone
        public string Fax { get; set; } // Fax
        public string WebSite { get; set; } // WebSite
        public long TeamId { get; set; } // TeamId

        // Foreign keys
        public virtual Account Account { get; set; } // FK_Sponsors_Accounts
        public virtual Team Team { get; set; } // FK_Sponsors_Teams

        public string SponsorsDir
        {
            get
            {
                if (TeamId == 0)
                    return (Globals.UploadDirRoot + "Accounts/" + AccountId + "/Sponsors/" + Id + "/");
                else
                    return (Globals.UploadDirRoot + "Teams/" + TeamId + "/Sponsors/" + Id + "/");
            }
        }

		public string LogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(SponsorsDir + m_logoName);
			}
		}
	}
}
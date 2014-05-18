using SportsManager.Models.Utils;
using System;
using System.Configuration;

namespace ModelObjects
{
/// <summary>
/// Summary description for Sponsor
/// </summary>
	public class Sponsor
	{
		private string m_logoName = "SponsorLogo.png";

		public Sponsor()
		{
		}
		public Sponsor(long id, string name, string streetAddress, string cityStateZip, string description, string eMail, string phone, string fax, string webSite, long teamId, long accountId)
		{
			Id = id;
			AccountId = accountId;
			Name = name;
			StreetAddress = streetAddress;
			CityStateZip = cityStateZip;
			Description = description;
			EMail = eMail;
			Phone = phone;
			Fax = fax;
			Website = webSite;
			TeamId = teamId;
		}

		public long Id { get; set; }
		public long AccountId { get; set; }
		public string Name { get; set; }
		public string StreetAddress { get; set; }
		public string CityStateZip { get; set; }
		public string Description { get; set; }
		public string EMail { get; set; }
		public string Phone { get; set; }
		public string Fax { get; set; }
		public string Website { get; set; }
        public long ContactId { get; set; }
		public long TeamId { get; set; }

        public String ContactName { get; set; }
        public String ContactPhotoUrl { get; set; }

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
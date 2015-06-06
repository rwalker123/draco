using SportsManager.Models.Utils;

namespace ModelObjects
{
    public class MemberBusiness
    {
		private string m_logoName = "MemberBusinessLogo.png";

        public long Id { get; set; } // id (Primary key)
        public long ContactId { get; set; } // ContactId
        public string Name { get; set; } // Name
        public string StreetAddress { get; set; } // StreetAddress
        public string CityStateZip { get; set; } // CityStateZip
        public string Description { get; set; } // Description
        public string EMail { get; set; } // EMail
        public string Phone { get; set; } // Phone
        public string Fax { get; set; } // Fax
        public string WebSite { get; set; } // WebSite

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_MemberBusiness_Contacts

        public string BusinessDir
        {
            get
            {
                return (Globals.UploadDirRoot + "Contacts/" + ContactId + "/MemberBusiness/" + Id + "/");
            }
        }

		public string LogoURL
		{
			get
			{
                return Storage.Provider.GetUrl(BusinessDir + m_logoName);
			}
		}
    }
}
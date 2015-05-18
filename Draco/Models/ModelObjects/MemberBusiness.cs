using SportsManager.Models.Utils;

namespace ModelObjects
{
    public class MemberBusiness
    {
		private string m_logoName = "MemberBusinessLogo.png";

		public MemberBusiness()
		{
		}

		public long Id { get; set; }
        public long ContactId { get; set; }
		public string Name { get; set; }
		public string StreetAddress { get; set; }
		public string CityStateZip { get; set; }
		public string Description { get; set; }
		public string EMail { get; set; }
		public string Phone { get; set; }
		public string Fax { get; set; }
		public string Website { get; set; }

        virtual public Contact Contact { get; set; }

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
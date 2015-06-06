using SportsManager.Models.Utils;

namespace ModelObjects
{
    // AccountHandouts
    public class AccountHandout
    {
        public long Id { get; set; } // Id (Primary key)
        public string Description { get; set; } // Description
        public string FileName { get; set; } // FileName
        public long AccountId { get; set; } // AccountId

        // Foreign keys
        public virtual Account Account { get; set; } // FK_AccountHandouts_Accounts

        protected override string HandoutDir
        {
            get
            {
                return Globals.UploadDirRoot + "Accounts/" + AccountId + "/Handouts/";
            }
        }

        public string HandoutURL
        {
            get
            {
                return Storage.Provider.GetUrl(HandoutDir + Id + "/" + FileName);
            }
        }
    }
}
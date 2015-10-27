using SportsManager.Models.Utils;

namespace ModelObjects
{
	public class TeamHandout
	{
        public long Id { get; set; } // Id (Primary key)
        public string Description { get; set; } // Description
        public string FileName { get; set; } // FileName
        public long TeamId { get; set; } // TeamId

        // Foreign keys
        public virtual Team Team { get; set; } // FK_TeamHandouts_Teams

		public string  HandoutDir
		{
			get 
			{ 
				return Globals.UploadDirRoot + "Teams/" + TeamId + "/Handouts/"; 
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

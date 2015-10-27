using SportsManager.Models.Utils;

namespace ModelObjects
{
/// <summary>
/// Summary description for PhotoGalleryItem
/// </summary>
	public class PhotoGalleryItem
	{
		private const string m_photoName = "PhotoGallery.jpg";
		private const string m_thumbPhotoName = "PhotoGalleryThumb.jpg";
        private static string m_SubmittedPhotoDir = Globals.UploadDirRoot + "SubmittedPhotos/";

        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Title { get; set; } // Title
        public string Caption { get; set; } // Caption
        public long AlbumId { get; set; } // AlbumId

        // Foreign keys
        public virtual Account Account { get; set; } // FK_PhotoGallery_Accounts
        public virtual PhotoGalleryAlbum PhotoGalleryAlbum { get; set; } // FK_PhotoGallery_PhotoGalleryAlbum
        
        public string PhotoURL
		{
			get 
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + AccountId + "/PhotoGallery/" + Id + "/" + m_photoName);
			}
		}

		public string PhotoThumbURL
		{
			get
			{
                return Storage.Provider.GetUrl(Globals.UploadDirRoot + "Accounts/" + AccountId + "/PhotoGallery/" + Id + "/" + m_thumbPhotoName);
			}
		}
    }
}
	

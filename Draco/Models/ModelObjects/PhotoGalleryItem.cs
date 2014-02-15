using System;
using System.Configuration;

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
        private static string m_PhotoGalleryUploadDir = Globals.UploadDirRoot + "PhotoGallery/";

		public PhotoGalleryItem()
		{
		}

		public PhotoGalleryItem(long id, string title, string caption, long accountId, long albumId)
		{
			Id = id;
			AccountId = accountId;
			Title = title;
		    Caption = caption;
			AlbumId = albumId;
		}

		public long Id
		{
            get; 
            set;
		}

		public long AlbumId
		{
            get;
            set;
        }

		public long AccountId
		{
            get;
            set;
        }

		public string Title
		{
            get;
            set;
        }

		public string Caption
		{
            get;
            set;
        }

		public string PhotoURL
		{
			get 
			{
				return m_PhotoGalleryUploadDir + Id + m_photoName;
			}
		}

		public string PhotoThumbURL
		{
			get
			{
				return m_PhotoGalleryUploadDir + Id + m_thumbPhotoName;
			}
		}

        static public string SubmittedPhotoDirURL
        {
            get
            {
                return m_SubmittedPhotoDir;
            }
        }

        public Guid SubmittedPhotoKey
        {
            get; set;
        }

        public string SubmittedBy
        {
            get; set;
        }

        public string SubmittedThumbPhotoName
        {
            get; set;
        }

        public string SubmittedPhotoThumbURL
        {
            get
            {
                return m_SubmittedPhotoDir + SubmittedThumbPhotoName;
            }
        }

        public string SubmittedPhotoThumbURLName
        {
            get
            {
                return m_SubmittedPhotoDir + SubmittedThumbPhotoName;
            }
        }

        public string SubmittedPhotoName
        {
            get;
            set;
        }

        public string SubmittedPhotoURL
        {
            get
            {
                return m_SubmittedPhotoDir + SubmittedPhotoName;
            }
        }

        public long SubmittedForTeamId
        {
            get;
            set;
        }
    }
}
	

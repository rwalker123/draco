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
				if (PhotoFile != null)
					return m_PhotoGalleryUploadDir + Id + m_photoName;
				else
					return null;
			}
		}

		public string PhotoURLName
		{
			get
			{
				return m_PhotoGalleryUploadDir + Id + m_photoName;
			}
		}

		public string PhotoFile
		{
			get
			{
				string logoPath = System.Web.HttpContext.Current.Server.MapPath(m_PhotoGalleryUploadDir + Id + m_photoName);
				System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
				if (fileInfo.Exists)
					return fileInfo.FullName;
				else
					return null;
			}
		}

		public string PhotoThumbURL
		{
			get 
			{
				if (PhotoThumbFile != null)
					return m_PhotoGalleryUploadDir + Id + m_thumbPhotoName;
				else
					return null;
			}
		}

		public string PhotoThumbURLName
		{
			get
			{
				return m_PhotoGalleryUploadDir + Id + m_thumbPhotoName;
			}
		}

		public string PhotoThumbFile
		{
			get
			{
				string logoPath = System.Web.HttpContext.Current.Server.MapPath(m_PhotoGalleryUploadDir + Id + m_thumbPhotoName);
				System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
				if (fileInfo.Exists)
					return fileInfo.FullName;
				else
					return null;
			}
		}

        static public string SubmittedPhotoDirURL
        {
            get
            {
                return m_SubmittedPhotoDir;
            }
        }

        static public string SubmittedPhotoDir
        {
            get
            {
                return System.Web.HttpContext.Current.Server.MapPath(m_SubmittedPhotoDir);
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
                if (SubmittedPhotoThumbFile != null)
                    return m_SubmittedPhotoDir + SubmittedThumbPhotoName;
                else
                    return null;
            }
        }

        public string SubmittedPhotoThumbURLName
        {
            get
            {
                return m_SubmittedPhotoDir + SubmittedThumbPhotoName;
            }
        }

        public string SubmittedPhotoThumbFile
        {
            get
            {
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(m_SubmittedPhotoDir + SubmittedThumbPhotoName);
                System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
                if (fileInfo.Exists)
                    return fileInfo.FullName;
                else
                    return null;
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
                if (SubmittedPhotoFile != null)
                    return m_SubmittedPhotoDir + SubmittedPhotoName;
                else
                    return null;
            }
        }

        public string SubmittedPhotoURLName
        {
            get
            {
                return m_SubmittedPhotoDir + SubmittedPhotoName;
            }
        }

        public string SubmittedPhotoFile
        {
            get
            {
                string logoPath = System.Web.HttpContext.Current.Server.MapPath(m_SubmittedPhotoDir + SubmittedPhotoName);
                System.IO.FileInfo fileInfo = new System.IO.FileInfo(logoPath);
                if (fileInfo.Exists)
                    return fileInfo.FullName;
                else
                    return null;
            }
        }

        public long SubmittedForTeamId
        {
            get;
            set;
        }
    }
}
	

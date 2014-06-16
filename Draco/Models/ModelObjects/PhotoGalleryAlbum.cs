using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for PhotoGalleryAlbum
	/// </summary>
    public class PhotoGalleryAlbum
    {
        private long m_id;
        private long m_accountId;
        private string m_title;
        private long m_albumId;
        private long m_teamId;

        public PhotoGalleryAlbum()
        {
        }

        public PhotoGalleryAlbum(long id, string title, long accountId, long albumId, long teamId)
        {
            m_id = id;
            m_accountId = accountId;
            m_title = title;
            m_albumId = albumId;
            m_teamId = teamId;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long ParentAlbumId
        {
            get { return m_albumId; }
            set { m_albumId = value; }
        }

        public long AccountId
        {
            get { return m_accountId; }
            set { m_accountId = value; }
        }

        public string Title
        {
            get { return m_title; }
            set { m_title = value; }
        }

        public long TeamId
        {
            get { return m_teamId; }
            set { m_teamId = value; }
        }

        public long PhotoCount
        {
            get;
            set;
        }
    }
}

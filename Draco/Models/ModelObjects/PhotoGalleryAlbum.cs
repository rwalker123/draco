using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for PhotoGalleryAlbum
	/// </summary>
    public class PhotoGalleryAlbum
    {
        public PhotoGalleryAlbum()
        {
            Photos = new Collection<PhotoGalleryItem>();
        }

        public long Id
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

        public long TeamId
        {
            get;
            set;
        }

        public virtual ICollection<PhotoGalleryItem> Photos { get; set; }
        public virtual Account Account { get; set; }
    }
}

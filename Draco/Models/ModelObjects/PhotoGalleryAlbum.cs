using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for PhotoGalleryAlbum
	/// </summary>
    public class PhotoGalleryAlbum
    {
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Title { get; set; } // Title
        public long ParentAlbumId { get; set; } // ParentAlbumId
        public long TeamId { get; set; } // TeamId

        // Reverse navigation
        public virtual ICollection<PhotoGalleryItem> PhotoGalleries { get; set; } // PhotoGallery.FK_PhotoGallery_PhotoGalleryAlbum

        public PhotoGalleryAlbum()
        {
            PhotoGalleries = new List<PhotoGalleryItem>();
        }
    }
}

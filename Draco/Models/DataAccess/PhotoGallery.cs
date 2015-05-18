namespace SportsManager.Models.DataAccess
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("PhotoGallery")]
    public partial class PhotoGallery
    {
        public long id { get; set; }

        public long AccountId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        [StringLength(255)]
        public string Caption { get; set; }

        public long AlbumId { get; set; }

        public virtual Account Account { get; set; }

        public virtual PhotoGalleryAlbum PhotoGalleryAlbum { get; set; }
    }
}

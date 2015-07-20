using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class PhotoAlbumViewModel
    {
        public long Id { get; set; }
        public long AccountId{ get; set; }
        public long ParentAlbumId { get; set; }
        public long TeamId { get; set }
        [Required]
        [StringLength(50, MinimumLength=1)]
        public String Title { get; set; }
        public int PhotoCount { get; set; }
    }
}
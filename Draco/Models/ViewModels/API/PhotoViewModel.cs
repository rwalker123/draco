using System;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class PhotoViewModel
    {
        public long Id { get; set; }
        [Required]
        [StringLength(50, MinimumLength=1)]
        public String Title {get; set; }
        [Required]
        [StringLength(255)]
        public String Caption { get; set; }
        public long AlbumId { get; set; }
        public long ReferenceId { get; set; }
        public string PhotoURL { get; set; }
        public string PhotoThumbURL { get; set; }
    }
}
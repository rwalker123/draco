using System;

namespace SportsManager.ViewModels.API
{
    public class PhotoViewModel
    {
        public long Id { get; set; }
        public String Title {get; set; }
        public String Caption { get; set; }
        public long AlbumId { get; set; }
        public long ReferenceId { get; set; }
    }
}
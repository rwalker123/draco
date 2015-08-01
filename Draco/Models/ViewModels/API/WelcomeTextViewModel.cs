using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class WelcomeTextViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public short OrderNo { get; set; }
        [Required]
        [StringLength(50, MinimumLength = 1)]
        public string CaptionMenu { get; set; }
        public string WelcomeText { get; set; }
        public long? TeamId { get; set; }
    }
}
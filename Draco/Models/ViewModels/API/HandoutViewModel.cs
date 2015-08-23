using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class HandoutViewModel
    {
        public long Id { get; set; }
        public string Description { get; set; }
        [Required]
        [StringLength(255, MinimumLength=1)]
        public string FileName { get; set; }
        public long ReferenceId { get; set; }
        public string HandoutURL { get; set; }
    }
}
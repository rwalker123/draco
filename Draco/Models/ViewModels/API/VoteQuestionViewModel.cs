using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class VoteQuestionViewModel
    {
        public long Id { get; set; } 
        public long AccountId { get; set; }
        [Required]
        [StringLength(255, MinimumLength = 1)]
        public string Question { get; set; }
        public bool Active { get; set; }
        [Required]
        public IEnumerable<VoteOptionViewModel> Options { get; set; }

    }
}
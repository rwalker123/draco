using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class ProfileCategoryViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        [Required]
        [StringLength(40, MinimumLength=1)]
        public String CategoryName { get; set; }
        public int Priority { get; set; }
        public IEnumerable<ProfileQuestionViewModel> Questions { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class VoteOptionViewModel
    {
        public long Id { get; set; }
        [Required]
        public long QuestionId { get; set; }
        [Required]
        [StringLength(255, MinimumLength = 1)]
        public string OptionText { get; set; }
        public int Priority { get; set; } 

    }
}
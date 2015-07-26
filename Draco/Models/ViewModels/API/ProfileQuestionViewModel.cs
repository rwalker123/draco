using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class ProfileQuestionViewModel
    {
        public long Id { get; set; }
        [Required] 
        public long CategoryId { get; set; }
        [Required]
        [StringLength(255, MinimumLength=1)] 
        public string Question { get; set; } 
        public int QuestionNum { get; set; } 
    }
}
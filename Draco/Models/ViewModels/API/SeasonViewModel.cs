using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class SeasonViewModel
    {
        public long Id { get; set; } 
        public long AccountId { get; set; }
        [Required]
        [StringLength(25, MinimumLength=1)] 
        public string Name { get; set; } 
    }
}

using System.ComponentModel.DataAnnotations;
namespace SportsManager.ViewModels.API
{
    public class FAQItemViewModel
    {
        public long Id { get; set; } 
        public long AccountId { get; set; } 
        [Required]
        public string Question { get; set; }
        public string Answer { get; set; }
    }
}
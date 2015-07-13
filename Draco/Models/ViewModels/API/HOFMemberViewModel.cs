using System;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class HOFMemberViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        [Required]
        public long ContactId { get; set; }
        [Required]
        public string Biography { get; set; }
        [Required]
        public int YearInducted { get; set; }
        [Required]
        public String Name { get; set; }
        public String PhotoURL { get; set; }
    }
}
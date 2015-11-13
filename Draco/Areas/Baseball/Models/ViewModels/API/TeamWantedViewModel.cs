using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.API
{
    public class TeamWantedViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public DateTime DateCreated { get; set; }
        [Required]
        [StringLength(50)]
        public String Name { get; set; }
        [Required]
        [StringLength(50)]
        public String EMail { get; set; }
        [Required]
        [StringLength(15)]
        public String Phone { get; set; }
        [Required]
        public String Experience { get; set; }
        [Required]
        [StringLength(50)]
        public String PositionsPlayed { get; set; }
        public DateTime BirthDate { get; set; }
        public bool CanEdit { get; set; }
    }
}
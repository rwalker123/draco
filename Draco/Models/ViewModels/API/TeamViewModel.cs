using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class TeamViewModel
    {
        public long Id { get; set; } 
        public long LeagueSeasonId { get; set; } 
        public long TeamId { get; set; }
        [Required]
        public string Name { get; set; } 
        public long DivisionSeasonId { get; set; }

        public long AccountId { get; set; }
        public String LeagueName { get; set; }
    }
}
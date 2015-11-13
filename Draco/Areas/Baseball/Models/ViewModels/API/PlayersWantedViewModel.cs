using System;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Baseball.ViewModels.API
{
    public class PlayersWantedViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public DateTime DateCreated  { get; set; }
        public long CreatedByContactId  { get; set; }
        [Required]
        [StringLength(50)]
        public String TeamEventName  { get; set; }
        [Required]
        public String Description  { get; set; }
        [Required]
        [StringLength(50)]
        public String PositionsNeeded  { get; set; }
        public String EMail { get; set; }
        public String Phone { get; set; }
        public String CreatedByName { get; set; }
        public String CreatedByPhotoUrl { get; set; }

    }
}
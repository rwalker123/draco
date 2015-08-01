using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class SponsorViewModel
    {
        public long Id { get; set; }
        public long ContactId { get; set; }
        public long AccountId { get; set; }
        [Required, StringLength(50, MinimumLength = 1)]
        public String Name { get; set; }
        [Required]
        public String StreetAddress { get; set; }
        [Required]
        public String CityStateZip { get; set; }
        [Required]
        public String Description { get; set; }
        [Required]
        public String EMail { get; set; }
        [Required]
        public String Phone { get; set; }
        [Required]
        public String Fax { get; set; }
        [Required]
        public String Website { get; set; }
        public String ContactName { get; set; }
        public String ContactPhotoUrl { get; set; }
        public long TeamId { get; set; }
    }
}
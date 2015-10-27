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
        public String StreetAddress { get; set; }
        public String CityStateZip { get; set; }
        public String Description { get; set; }
        public String EMail { get; set; }
        public String Phone { get; set; }
        public String Fax { get; set; }
        public String Website { get; set; }
        public String ContactName { get; set; }
        public String ContactPhotoUrl { get; set; }
        public long TeamId { get; set; }
        public string LogoURL { get; set; }
    }
}
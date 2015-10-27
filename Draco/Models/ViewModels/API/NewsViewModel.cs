using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.ViewModels.API
{
    public class NewsViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public DateTime Date { get; set; }
        public string Text { get; set; } // Text
        public bool SpecialAnnounce { get; set; }
        public String Title { get; set; }
    }
}
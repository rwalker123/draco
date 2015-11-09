using System;

namespace SportsManager.ViewModels.API
{
    public class PlayerViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public long TeamId { get; set; } 
        public int PlayerNumber { get; set; }
        public bool SubmittedWaiver { get; set; }
        public ContactViewModel Contact { get; set; } 
        public bool SubmittedDriversLicense { get; set; } 
        public DateTime DateAdded { get; set; }
        public string AffiliationDuesPaid { get; set; }  
        public int GamesPlayed { get; set; }  
        public int FirstYear { get; set; }
    }
}
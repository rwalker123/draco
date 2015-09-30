using System;

namespace SportsManager.ViewModels.API
{
    public class NameSearchViewModel
    {
        public String LastName { get; set; }
        public String FirstName { get; set; }
        public int Page { get; set; }
    }
}
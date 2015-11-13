using SportsManager.ViewModels.API;

namespace SportsManager.Baseball.ViewModels.API
{
    public class UmpireViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public long ContactId { get; set; }
        public ContactViewModel Contact { get; set; }
    }
}
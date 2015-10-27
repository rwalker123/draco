

namespace SportsManager.ViewModels.API
{
    /// <summary>
    /// Help class to hold some basic information about the current season.
    /// </summary>
    public class CurrentSeasonViewModel
    {
        public bool HasSeasons { get; set; }
        public string SeasonName { get; set; }
        public long SeasonId { get; set; }
        public long AccountId { get; set; }
    }
}
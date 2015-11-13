namespace SportsManager.Baseball.ViewModels.API
{
    public class GameRecapViewModel
    {
        public long GameId { get; set; }
        public long TeamId { get; set; }
        public string Recap { get; set; }
    }
}
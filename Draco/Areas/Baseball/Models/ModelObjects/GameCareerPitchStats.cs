
namespace ModelObjects
{
    /// <summary>
    /// Summary description for GameCareerPitchStats
    /// </summary>
    public class GameCareerPitchStats : GamePitchStats
    {
        public string SeasonName { get; set; }
        public string TeamName { get; set; }
        public string LeagueName { get; set; }

        protected override ContactName PlayerNameQuery()
        {
            return DataAccess.TeamRoster.GetPlayerName(PlayerId, fromRoster: true);
        }
    }
}

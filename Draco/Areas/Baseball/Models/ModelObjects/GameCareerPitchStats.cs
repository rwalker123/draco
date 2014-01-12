
namespace ModelObjects
{
    /// <summary>
    /// Summary description for GameCareerPitchStats
    /// </summary>
    public class GameCareerPitchStats : GamePitchStats
    {
        public GameCareerPitchStats()
        {
        }

        public GameCareerPitchStats(long playerId, string seasonName, string teamName, string leagueName, int ip, int ip2, int bf, int w, int l, int s, int h,
                        int r, int er, int d, int t, int hr, int so, int bb, int wp, int hbp, int bk, int sc)
            : base(0, playerId, 0, 0, ip, ip2, bf, w, l, s, h, r, er, d, t, hr, so, bb, wp, hbp, bk, sc)
        {
            SeasonName = seasonName;
            TeamName = teamName;
            LeagueName = leagueName;
        }

        public string SeasonName { get; set; }
        public string TeamName { get; set; }
        public string LeagueName { get; set; }

        protected override ContactName PlayerNameQuery()
        {
            return DataAccess.TeamRoster.GetPlayerName(PlayerId, fromRoster: true);
        }
    }
}


namespace ModelObjects
{
	/// <summary>
	/// Summary description for GameCareerBatStats
	/// </summary>
	public class GameCareerBatStats : GameBatStats
	{
		public GameCareerBatStats()
		{
		}

		public GameCareerBatStats(long playerId, string seasonName, string teamName, string leagueName, int ab, int h,
						int r, int d, int t, int hr, int rbi, int so, int bb, int hbp, int intr, int sf, int sh, int sb)
			: base(0, playerId, 0, 0, ab, h, r, d, t, hr, rbi, so, bb, -1, hbp, intr, sf, sh, sb, -1, -1)
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

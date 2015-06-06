
namespace ModelObjects
{
	/// <summary>
	/// Summary description for GameCareerBatStats
	/// </summary>
	public class GameCareerBatStats : GameBatStats
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

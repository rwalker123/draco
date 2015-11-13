
namespace SportsManager.Golf.ViewModels.Controllers
{
	public class PlayerScoreViewModel
	{
		public PlayerScoreViewModel(long playerId, string playerName, int score)
		{
			PlayerId = playerId;
			PlayerName = playerName;
			Score = score;
		}

		public long PlayerId { get; private set; }
		public string PlayerName { get; private set; }
		public int Score { get; private set; }
	}
}
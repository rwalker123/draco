using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels
{
	public class PlayerHoleSkinViewModel
	{
		public PlayerHoleSkinViewModel(long playerId, string playerName, int holeNo, int holeScore)
		{
			PlayerId = playerId;
			PlayerName = playerName;
			HoleNumber = holeNo;
			HoleScore = holeScore;
		}

		[ScaffoldColumn(false)]
		public long PlayerId { get; private set; }

		[DisplayName("Player")]
		public string PlayerName { get; private set; }

		[DisplayName("Hole")]
		public int HoleNumber { get; private set; }

		[DisplayName("Score")]
		public int HoleScore { get; private set; }
	}
}
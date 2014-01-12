using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using DataAccess.Golf;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
	public class PlayerHandicapViewModel
	{
		public PlayerHandicapViewModel(GolfRoster player)
			: this(player.Contact)
		{
			PlayerId = player.Id;
		}

		private PlayerHandicapViewModel(Contact contact)
		{
			HandicapIndex = GolfScores.CalculateHandicapIndexOnDate(contact.Id, DateTime.MaxValue, for9Holes: true);
			PlayerName = String.Format("{0} {1}", contact.FirstName, contact.LastName);

		}

		[ScaffoldColumn(false)]
		public long PlayerId { get; private set; }
		[DisplayName("Player")]
		public string PlayerName { get; private set; }
		[DisplayName("Handicap Index")]
		public double? HandicapIndex { get; private set; }
	}
}

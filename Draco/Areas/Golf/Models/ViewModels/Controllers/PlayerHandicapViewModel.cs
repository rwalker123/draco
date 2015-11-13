using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class PlayerHandicapViewModel 
	{
        private IDb DB { get; }

		public PlayerHandicapViewModel(IDb db, GolfRoster player)
			: this(player.Contact)
		{
            this.DB = db;
			PlayerId = player.Id;
		}

		private PlayerHandicapViewModel(Contact contact)
		{
			HandicapIndex = DB.CalculateHandicapIndexOnDate(contact.Id, DateTime.MaxValue, for9Holes: true);
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

using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels
{
	public class FlightViewModel
	{
		public FlightViewModel(long accountId, long seasonId, long id)
		{
			AccountId = accountId;
			SeasonId = seasonId;
			FlightId = id;
		}

		[ScaffoldColumn(false)]
		public long FlightId { get; private set; }

		[ScaffoldColumn(false)]
		public long AccountId { get; private set; }

		[ScaffoldColumn(false)]
		public long SeasonId { get; private set; }

		[Required, DisplayName("Flight Name"), StringLength(25)]
		public string Name { get; set; }
	}
}
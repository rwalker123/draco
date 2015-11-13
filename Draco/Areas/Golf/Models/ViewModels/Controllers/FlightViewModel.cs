using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels.Controllers
{
	public class FlightViewModel
	{
		public FlightViewModel()
		{
		}

		[ScaffoldColumn(false)]
		public long FlightId { get; set; }

		[ScaffoldColumn(false)]
		public long AccountId { get; set; }

		[ScaffoldColumn(false)]
		public long SeasonId { get; set; }

		[Required, DisplayName("Flight Name"), StringLength(25)]
		public string Name { get; set; }
	}
}
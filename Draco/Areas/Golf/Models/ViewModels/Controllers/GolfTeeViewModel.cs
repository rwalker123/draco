using SportsManager.Golf.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels
{
    public class GolfTeeViewModel
	{
		public GolfTeeViewModel()
		{
			HoleDistances = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
		}

		[ScaffoldColumn(false)]
		public long TeeId { get; set; }
		[ScaffoldColumn(false)]
		public long CourseId { get; set; }

		[DisplayName("Tee Color"), StringLength(20), Required]
		public String TeeColor { get; set; }

		[DisplayName("Mens Rating")]
		public double MensRating { get; set; }

		[DisplayName("Mens Slope")]
		public int MensSlope { get; set; }

		[DisplayName("Women Rating")]
		public double WomensRating { get; set; }

		[DisplayName("Women Slope")]
		public int WomensSlope { get; set; }

		[ScaffoldColumn(false)]
		public int this[int index]
		{
			set
			{
				HoleDistances[index] = value;
			}

			get
			{
				return HoleDistances[index];
			}
		}

		[UIHint("IntCollectionData")]
		public IList<int> HoleDistances { get; set; }
	}
}
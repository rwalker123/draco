using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using SportsManager.Models;

namespace SportsManager.Golf.ViewModels
{
	public class GolfTeeViewModel
	{
		public GolfTeeViewModel(long courseId)
		{
			CourseId = courseId;
			HoleDistances = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
		}

		[ScaffoldColumn(false)]
		public long TeeId { get; set; }
		[ScaffoldColumn(false)]
		public long CourseId { get; private set; }

		[DisplayName("Tee Color"), StringLength(20), Required]
		public String TeeColor { get; set; }

		[DisplayName("Mens Rating")]
		public double MensRating { get; set; }

		[DisplayName("Mens Slope")]
		public double MensSlope { get; set; }

		[DisplayName("Women Rating")]
		public double WomensRating { get; set; }

		[DisplayName("Women Slope")]
		public double WomensSlope { get; set; }

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

		public static GolfTeeInformation GetCourseTeeFromViewModel(GolfTeeViewModel vm)
		{
			GolfTeeInformation teeInfo = new GolfTeeInformation()
			{
				Id = vm.TeeId,
				CourseId = vm.CourseId,
				TeeColor = vm.TeeColor,
				TeeName = String.Empty,
			};

			return teeInfo;
		}

		public static GolfTeeViewModel GetCourseTeeViewModel(GolfTeeInformation teeInfo)
		{
			GolfTeeViewModel vm = new GolfTeeViewModel(teeInfo.CourseId)
			{
				TeeId = teeInfo.Id,
				TeeColor = teeInfo.TeeColor,
			};

			return vm;
		}

	}
}
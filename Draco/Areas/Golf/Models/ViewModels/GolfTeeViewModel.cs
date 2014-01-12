using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using SportsManager.Model;

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
				MensRating = vm.MensRating,
				MensSlope = vm.MensSlope,
				WomansRating = vm.WomensRating,
				WomansSlope = vm.WomensSlope
			};

			teeInfo.DistanceHole1 = vm.HoleDistances[0];
			teeInfo.DistanceHole2 = vm.HoleDistances[1];
			teeInfo.DistanceHole3 = vm.HoleDistances[2];
			teeInfo.DistanceHole4 = vm.HoleDistances[3];
			teeInfo.DistanceHole5 = vm.HoleDistances[4];
			teeInfo.DistanceHole6 = vm.HoleDistances[5];
			teeInfo.DistanceHole7 = vm.HoleDistances[6];
			teeInfo.DistanceHole8 = vm.HoleDistances[7];
			teeInfo.DistanceHole9 = vm.HoleDistances[8];
			teeInfo.DistanceHole10 = vm.HoleDistances[9];
			teeInfo.DistanceHole11 = vm.HoleDistances[10];
			teeInfo.DistanceHole12 = vm.HoleDistances[11];
			teeInfo.DistanceHole13 = vm.HoleDistances[12];
			teeInfo.DistanceHole14 = vm.HoleDistances[13];
			teeInfo.DistanceHole15 = vm.HoleDistances[14];
			teeInfo.DistanceHole16 = vm.HoleDistances[15];
			teeInfo.DistanceHole17 = vm.HoleDistances[16];
			teeInfo.DistanceHole18 = vm.HoleDistances[17];

			return teeInfo;
		}

		public static GolfTeeViewModel GetCourseTeeViewModel(GolfTeeInformation teeInfo)
		{
			GolfTeeViewModel vm = new GolfTeeViewModel(teeInfo.CourseId)
			{
				TeeId = teeInfo.Id,
				TeeColor = teeInfo.TeeColor,
				MensRating = teeInfo.MensRating,
				MensSlope = teeInfo.MensSlope,
				WomensRating = teeInfo.WomansRating,
				WomensSlope = teeInfo.WomansSlope
			};

			vm.HoleDistances[0] = teeInfo.DistanceHole1;
			vm.HoleDistances[1] = teeInfo.DistanceHole2;
			vm.HoleDistances[2] = teeInfo.DistanceHole3;
			vm.HoleDistances[3] = teeInfo.DistanceHole4;
			vm.HoleDistances[4] = teeInfo.DistanceHole5;
			vm.HoleDistances[5] = teeInfo.DistanceHole6;
			vm.HoleDistances[6] = teeInfo.DistanceHole7;
			vm.HoleDistances[7] = teeInfo.DistanceHole8;
			vm.HoleDistances[8] = teeInfo.DistanceHole9;
			vm.HoleDistances[9] = teeInfo.DistanceHole10;
			vm.HoleDistances[10] = teeInfo.DistanceHole11;
			vm.HoleDistances[11] = teeInfo.DistanceHole12;
			vm.HoleDistances[12] = teeInfo.DistanceHole13;
			vm.HoleDistances[13] = teeInfo.DistanceHole14;
			vm.HoleDistances[14] = teeInfo.DistanceHole15;
			vm.HoleDistances[15] = teeInfo.DistanceHole16;
			vm.HoleDistances[16] = teeInfo.DistanceHole17;
			vm.HoleDistances[17] = teeInfo.DistanceHole18;

			return vm;
		}

	}
}
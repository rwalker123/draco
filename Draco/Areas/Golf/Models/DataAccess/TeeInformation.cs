using System.Collections.Generic;
using System.Drawing;
using System.Linq;

using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
	/// <summary>
	/// Summary description for TeeInformation
	/// </summary>
	public static class TeeInformation
	{
		public static List<Color> GetTeeColors()
		{
			List<Color> colors = new List<Color>();


			colors.Add(Color.Black);
			colors.Add(Color.Blue);
			colors.Add(Color.FromArgb(0x8C, 0x78, 0x53)); //Bronze);
			colors.Add(Color.Brown);
			colors.Add(Color.FromArgb(0xFD, 0xF5, 0xE6)); // Cream
			colors.Add(Color.FromArgb(0xB8, 0x73, 0x73)); //Copper);
			colors.Add(Color.Gold);
			colors.Add(Color.Green);
			colors.Add(Color.Gray);
			colors.Add(Color.Magenta);
			colors.Add(Color.Maroon);
			colors.Add(Color.Orange);
			colors.Add(Color.Pink);
			colors.Add(Color.Purple);
			colors.Add(Color.Red);
			colors.Add(Color.Silver);
			colors.Add(Color.Tan);
			colors.Add(Color.Teal);
			colors.Add(Color.Yellow);
			colors.Add(Color.White);

			return colors;
		}

		public static string GetTeeName(long teeId)
		{
            DB db = DBConnection.GetContext();

			return (from ti in db.GolfTeeInformations
					where ti.Id == teeId
					select ti.TeeName).SingleOrDefault();
		}

		public static string GetTeeColor(long teeId)
		{
            DB db = DBConnection.GetContext();

			return (from ti in db.GolfTeeInformations
					where ti.Id == teeId
					select ti.TeeColor).SingleOrDefault();
		}

		public static GolfTeeInformation GetTeeInformation(long teeId)
		{
            DB db = DBConnection.GetContext();

			return (from ti in db.GolfTeeInformations
					where ti.Id == teeId
					select ti).SingleOrDefault();
		}

		public static IEnumerable<GolfTeeInformation> GetTeesIdAndNameForCourse(long courseId)
		{
            DB db = DBConnection.GetContext();

			return (from ti in db.GolfTeeInformations
					where ti.CourseId == courseId
					orderby ti.Priority ascending
					select ti);
		}

		public static long AddTee(GolfTeeInformation teeInfo)
		{
            DB db = DBConnection.GetContext();

			db.GolfTeeInformations.InsertOnSubmit(teeInfo);
			db.SubmitChanges();

			return teeInfo.Id;
		}

		public static bool ModifyTee(GolfTeeInformation teeInfo)
		{
            DB db = DBConnection.GetContext();

			GolfTeeInformation dbTee = (from ti in db.GolfTeeInformations
										where ti.Id == teeInfo.Id
										select ti).SingleOrDefault();

			if (dbTee == null)
				return false;

			dbTee.TeeColor = teeInfo.TeeColor;
			dbTee.TeeName = teeInfo.TeeName;

			dbTee.MensRating = teeInfo.MensRating;
			dbTee.MensRatingBack9 = teeInfo.MensRatingBack9;
			dbTee.MensRatingFront9 = teeInfo.MensRatingFront9;
			dbTee.MensSlope = teeInfo.MensSlope;
			dbTee.MensSlopeBack9 = teeInfo.MensSlopeBack9;
			dbTee.MensSlopeFront9 = teeInfo.MensSlopeFront9;
			dbTee.WomansRating = teeInfo.WomansRating;
			dbTee.WomansRatingBack9 = teeInfo.WomansRatingBack9;
			dbTee.WomansRatingFront9 = teeInfo.WomansRatingFront9;
			dbTee.WomansSlope = teeInfo.WomansSlope;
			dbTee.WomansSlopeBack9 = teeInfo.WomansSlopeBack9;
			dbTee.WomansSlopeFront9 = teeInfo.WomansSlopeFront9;

			dbTee.DistanceHole1 = teeInfo.DistanceHole1;
			dbTee.DistanceHole2 = teeInfo.DistanceHole2;
			dbTee.DistanceHole3 = teeInfo.DistanceHole3;
			dbTee.DistanceHole4 = teeInfo.DistanceHole4;
			dbTee.DistanceHole5 = teeInfo.DistanceHole5;
			dbTee.DistanceHole6 = teeInfo.DistanceHole6;
			dbTee.DistanceHole7 = teeInfo.DistanceHole7;
			dbTee.DistanceHole8 = teeInfo.DistanceHole8;
			dbTee.DistanceHole9 = teeInfo.DistanceHole9;
			dbTee.DistanceHole10 = teeInfo.DistanceHole10;
			dbTee.DistanceHole11 = teeInfo.DistanceHole11;
			dbTee.DistanceHole12 = teeInfo.DistanceHole12;
			dbTee.DistanceHole13 = teeInfo.DistanceHole13;
			dbTee.DistanceHole14 = teeInfo.DistanceHole14;
			dbTee.DistanceHole15 = teeInfo.DistanceHole15;
			dbTee.DistanceHole16 = teeInfo.DistanceHole16;
			dbTee.DistanceHole17 = teeInfo.DistanceHole17;
			dbTee.DistanceHole18 = teeInfo.DistanceHole18;

			db.SubmitChanges();

			return true;
		}

		public static bool RemoveTee(long teeId)
		{
            DB db = DBConnection.GetContext();

			var teeInfo = (from ti in db.GolfTeeInformations
						   where ti.Id == teeId
						   select ti).SingleOrDefault();

			if (teeInfo == null)
				return false;

			db.GolfTeeInformations.DeleteOnSubmit(teeInfo);

			db.SubmitChanges();

			return true;
		}
	}
}
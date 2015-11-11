using ModelObjects;
using System;
using System.Collections.Generic;

namespace SportsManager.Models
{
	/// <summary>
	/// Summary description for GolfScore
	/// </summary>
	public class GolfScore
	{
        public long Id { get; set; } // Id (Primary key)
        public long CourseId { get; set; } // CourseId
        public long ContactId { get; set; } // ContactId
        public long TeeId { get; set; } // TeeId
        public DateTime DatePlayed { get; set; } // DatePlayed
        public int HolesPlayed { get; set; } // HolesPlayed
        public int TotalScore { get; set; } // TotalScore
        public bool TotalsOnly { get; set; } // TotalsOnly
        public int HoleScore1 { get; set; } // HoleScore1
        public int HoleScore2 { get; set; } // HoleScore2
        public int HoleScore3 { get; set; } // HoleScore3
        public int HoleScore4 { get; set; } // HoleScore4
        public int HoleScore5 { get; set; } // HoleScore5
        public int HoleScore6 { get; set; } // HoleScore6
        public int HoleScore7 { get; set; } // HoleScore7
        public int HoleScore8 { get; set; } // HoleScore8
        public int HoleScore9 { get; set; } // HoleScore9
        public int HoleScore10 { get; set; } // HoleScore10
        public int HoleScore11 { get; set; } // HoleScore11
        public int HoleScore12 { get; set; } // HoleScore12
        public int HoleScore13 { get; set; } // HoleScore13
        public int HoleScore14 { get; set; } // HoleScore14
        public int HoleScore15 { get; set; } // HoleScore15
        public int HoleScore16 { get; set; } // HoleScore16
        public int HoleScore17 { get; set; } // HoleScore17
        public int HoleScore18 { get; set; } // HoleScore18
        public double? StartIndex { get; set; } // StartIndex
        public double? StartIndex9 { get; set; } // StartIndex9

        // Reverse navigation
        public virtual ICollection<GolferStatsValue> GolferStatsValues { get; set; } // GolferStatsValue.FK_GolferStatsValue_GolfScore
        public virtual ICollection<GolfMatchScore> GolfMatchScores { get; set; } // Many to many mapping

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_GolfScore_Contacts
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfScore_GolfCourse
        public virtual GolfTeeInformation GolfTeeInformation { get; set; } // FK_GolfScore_GolfTeeInformation

        public GolfScore()
        {
            GolferStatsValues = new List<GolferStatsValue>();
            GolfMatchScores = new List<GolfMatchScore>();
        }

        public enum eHolesPlayed { Eighteen = 0, Front9 = 1, Back9 = 2 };

		public double GetRating()
		{
			return GolfTeeInformation.GetRating(Contact.IsFemale.GetValueOrDefault(), HolesPlayed);
		}

		public double GetSlope()
		{
			return GolfTeeInformation.GetSlope(Contact.IsFemale.GetValueOrDefault(), HolesPlayed);
		}

		public int Front9Score
		{
			get
			{
				return HoleScore1 + HoleScore2 + HoleScore3 + HoleScore4 + HoleScore5 + HoleScore6 + HoleScore7 + HoleScore8 + HoleScore9;
			}
		}

		public int Back9Score
		{
			get
			{
				return HoleScore10 + HoleScore11 + HoleScore12 + HoleScore13 + HoleScore14 + HoleScore15 + HoleScore16 + HoleScore17 + HoleScore18;
			}
		}

		public int HoleScore(int holeNo)
		{
			switch (holeNo)
			{
				case 1:
					return HoleScore1;
				case 2:
					return HoleScore2;
				case 3:
					return HoleScore3;
				case 4:
					return HoleScore4;
				case 5:
					return HoleScore5;
				case 6:
					return HoleScore6;
				case 7:
					return HoleScore7;
				case 8:
					return HoleScore8;
				case 9:
					return HoleScore9;
				case 10:
					return HoleScore10;
				case 11:
					return HoleScore11;
				case 12:
					return HoleScore12;
				case 13:
					return HoleScore13;
				case 14:
					return HoleScore14;
				case 15:
					return HoleScore15;
				case 16:
					return HoleScore16;
				case 17:
					return HoleScore17;
				case 18:
					return HoleScore18;
			}

			return 0;
		}

		const double MAX_WOMEN_HANDICAP_INDEX = 40.4;
		const double MAX_MEN_HANDICAP_INDEX = 36.4;

		public int TotalESCScore(bool for9Holes)
		{
			if (TotalsOnly)
				return TotalScore;

			bool isFemale = this.Contact.IsFemale.GetValueOrDefault();
			double courseSlope = GetSlope();

			if (courseSlope == 0.0)
				return TotalScore;

			int courseHandicap = CalculateCourseHandicap(GetStartIndex(isFemale, for9Holes), courseSlope);

			int totalESCScore = 0;

			for (int i = 1; i <= HolesPlayed; ++i)
			{
				totalESCScore += CalculateESCScore(HoleScore(i), GolfCourse.GetHolePar(isFemale, i), courseHandicap, for9Holes);
			}

			return totalESCScore;
		}

		public double GetStartIndex(bool isFemale, bool for9Holes = false)
		{
			if (for9Holes)
				return GetStartIndex9(StartIndex9, isFemale);
			else
				return GetStartIndex(StartIndex, isFemale);
		}

		public static double GetStartIndex(double? startIndex, bool isFemale)
		{
			double index;

			if (startIndex.HasValue)
				index = startIndex.Value;
			else if (isFemale)
				index = MAX_WOMEN_HANDICAP_INDEX;
			else
				index = MAX_MEN_HANDICAP_INDEX;

			return index;
		}

		public static double GetStartIndex9(double? startIndex, bool isFemale)
		{
			double index;

			if (startIndex.HasValue)
				index = startIndex.Value;
			else if (isFemale)
				index = MAX_WOMEN_HANDICAP_INDEX / 2;
			else
				index = MAX_MEN_HANDICAP_INDEX / 2;

			return index;
		}

		public static int CalculateESCScore(int score, int holePar, int courseHandicap, bool is9Holes)
		{
			if (is9Holes)
			{
				// < 4 Double Bogey
				// 5-9 7
				// 10-14 8
				// 15-19 9
				// > 20 10
				if (courseHandicap <= 4)
					return Math.Min(score, holePar + 2);
				else if (courseHandicap <= 9)
					return Math.Min(score, 7);
				else if (courseHandicap <= 14)
					return Math.Min(score, 8);
				else if (courseHandicap <= 19)
					return Math.Min(score, 9);
				else
					return Math.Min(score, 10);
			}
			else
			{
				if (courseHandicap <= 9)
					return Math.Min(score, holePar + 2);
				else if (courseHandicap <= 19)
					return Math.Min(score, 7);
				else if (courseHandicap <= 29)
					return Math.Min(score, 8);
				else if (courseHandicap <= 39)
					return Math.Min(score, 9);
				else
					return Math.Min(score, 10);
			}
		}

		public static int CalculateCourseHandicap(double index, double slope)
		{
			return (int)Math.Round((index * slope) / 113);
		}

		public static double CalculateDifferential(int score, double rating, double slope)
		{
			return Math.Round(((score - rating) * 113) / slope, 1);
		}

		public static double CalculateIndex(double totalDiffs, int numDiffs)
		{
			return Math.Round((totalDiffs / numDiffs) * 0.96, 1);
		}
	}
}

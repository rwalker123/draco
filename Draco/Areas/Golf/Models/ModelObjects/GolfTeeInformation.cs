
using System.Collections.Generic;

namespace SportsManager.Models
{
	public class GolfTeeInformation
	{
        public long Id { get; set; } // Id (Primary key)
        public long CourseId { get; set; } // CourseId
        public string TeeColor { get; set; } // TeeColor
        public string TeeName { get; set; } // TeeName
        public double MensRating { get; set; } // MensRating
        public double MensSlope { get; set; } // MensSlope
        public double WomansRating { get; set; } // WomansRating
        public double WomansSlope { get; set; } // WomansSlope
        public double MensRatingFront9 { get; set; } // MensRatingFront9
        public double MensSlopeFront9 { get; set; } // MensSlopeFront9
        public double WomansRatingFront9 { get; set; } // WomansRatingFront9
        public double WomansSlopeFront9 { get; set; } // WomansSlopeFront9
        public double MensRatingBack9 { get; set; } // MensRatingBack9
        public double MensSlopeBack9 { get; set; } // MensSlopeBack9
        public double WomansRatingBack9 { get; set; } // WomansRatingBack9
        public double WomansSlopeBack9 { get; set; } // WomansSlopeBack9
        public int DistanceHole1 { get; set; } // DistanceHole1
        public int DistanceHole2 { get; set; } // DistanceHole2
        public int DistanceHole3 { get; set; } // DistanceHole3
        public int DistanceHole4 { get; set; } // DistanceHole4
        public int DistanceHole5 { get; set; } // DistanceHole5
        public int DistanceHole6 { get; set; } // DistanceHole6
        public int DistanceHole7 { get; set; } // DistanceHole7
        public int DistanceHole8 { get; set; } // DistanceHole8
        public int DistanceHole9 { get; set; } // DistanceHole9
        public int DistanceHole10 { get; set; } // DistanceHole10
        public int DistanceHole11 { get; set; } // DistanceHole11
        public int DistanceHole12 { get; set; } // DistanceHole12
        public int DistanceHole13 { get; set; } // DistanceHole13
        public int DistanceHole14 { get; set; } // DistanceHole14
        public int DistanceHole15 { get; set; } // DistanceHole15
        public int DistanceHole16 { get; set; } // DistanceHole16
        public int DistanceHole17 { get; set; } // DistanceHole17
        public int DistanceHole18 { get; set; } // DistanceHole18
        public int Priority { get; set; } // Priority

        // Reverse navigation
        public virtual ICollection<GolfScore> GolfScores { get; set; } // GolfScore.FK_GolfScore_GolfTeeInformation

        // Foreign keys
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfTeeInformation_GolfCourse

        public GolfTeeInformation()
        {
            Priority = 0;
            GolfScores = new List<GolfScore>();
        }

        public double GetSlope(bool isFemale, int holesPlayed)
		{
			double courseSlope = 0.0;

			if (isFemale)
			{
				if (holesPlayed == 9)
				{
					if (WomansSlopeFront9 != 0)
						courseSlope = WomansSlopeFront9;
				}

				if (courseSlope == 0.0)
				{
					if (WomansSlope != 0)
						courseSlope = WomansSlope;
				}
			}

			// isn't female or don't have women ratings separate.
			if (courseSlope == 0.0)
			{
				if (holesPlayed == 9)
				{
					if (MensSlopeFront9 != 0)
						courseSlope = MensSlopeFront9;
				}

				if (courseSlope == 0.0)
				{
					if (MensSlope != 0)
						courseSlope = MensSlope;
				}
			}

			return courseSlope;
		}

		public double GetRating(bool isFemale, int holesPlayed)
		{
			double courseRating = 0.0;

			if (isFemale)
			{
				if (holesPlayed == 9)
				{
					// make an 18 hole rating.
					if (WomansSlopeFront9 != 0)
						courseRating = WomansRatingFront9 * 2.0;
				}

				if (courseRating == 0.0)
				{
					if (WomansRating != 0)
					{
						if (GolfCourse.NumberOfHoles == 9)
							courseRating = WomansRating * 2.0;
						else
							courseRating = WomansRating;
					}
				}
			}

			// isn't female or don't have women ratings separate.
			if (courseRating == 0.0)
			{
				if (holesPlayed == 9)
				{
					if (MensRatingFront9 != 0)
						courseRating = MensRatingFront9 * 2.0;
				}

				if (courseRating == 0.0)
				{
					if (MensRating != 0)
					{
						// 9 hole course should have 9 hole rating.
						if (GolfCourse.NumberOfHoles == 9)
							courseRating = MensRating * 2.0;
						else
							courseRating = MensRating;
					}
				}
			}

			return courseRating;
		}

        public int HoleDistance(int holeNo)
        {
            switch (holeNo)
            {
                case 1:
                    return DistanceHole1;

                case 2:
                    return DistanceHole2;

                case 3:
                    return DistanceHole3;

                case 4:
                    return DistanceHole4;

                case 5:
                    return DistanceHole5;

                case 6:
                    return DistanceHole6;

                case 7:
                    return DistanceHole7;

                case 8:
                    return DistanceHole8;

                case 9:
                    return DistanceHole9;

                case 10:
                    return DistanceHole10;

                case 11:
                    return DistanceHole11;

                case 12:
                    return DistanceHole12;

                case 13:
                    return DistanceHole13;

                case 14:
                    return DistanceHole14;

                case 15:
                    return DistanceHole15;

                case 16:
                    return DistanceHole16;

                case 17:
                    return DistanceHole17;

                case 18:
                    return DistanceHole18;
            }

            return 0;
        }

        public void SetHoleDistance(int holeNo, int distance)
        {
            switch (holeNo)
            {
                case 1:
                    DistanceHole1 = distance;
                    break;

                case 2:
                    DistanceHole2 = distance;
                    break;

                case 3:
                    DistanceHole3 = distance;
                    break;

                case 4:
                    DistanceHole4 = distance;
                    break;

                case 5:
                    DistanceHole5 = distance;
                    break;

                case 6:
                    DistanceHole6 = distance;
                    break;

                case 7:
                    DistanceHole7 = distance;
                    break;

                case 8:
                    DistanceHole8 = distance;
                    break;

                case 9:
                    DistanceHole9 = distance;
                    break;

                case 10:
                    DistanceHole10 = distance;
                    break;

                case 11:
                    DistanceHole11 = distance;
                    break;

                case 12:
                    DistanceHole12 = distance;
                    break;

                case 13:
                    DistanceHole13 = distance;
                    break;

                case 14:
                    DistanceHole14 = distance;
                    break;

                case 15:
                    DistanceHole15 = distance;
                    break;

                case 16:
                    DistanceHole16 = distance;
                    break;

                case 17:
                    DistanceHole17 = distance;
                    break;

                case 18:
                    DistanceHole18 = distance;
                    break;
            }
        }
    }
}
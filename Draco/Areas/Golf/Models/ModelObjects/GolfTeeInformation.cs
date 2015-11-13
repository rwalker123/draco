
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Models
{
	public class GolfTeeInformation
	{
        public long Id { get; set; } // Id (Primary key)
        public long CourseId { get; set; } // CourseId
        public string TeeColor { get; set; } // TeeColor
        public string TeeName { get; set; } // TeeName
        public int Priority { get; set; } // Priority

        // Reverse navigation
        public virtual ICollection<GolfScore> GolfScores { get; set; } // GolfScore.FK_GolfScore_GolfTeeInformation

        public virtual IList<GolfTeeHoleDistance> HoleDistances { get; set; }

        public virtual IList<GolfTeeMenSlopeRating> MenSlopeRatings { get; set; }
        public virtual IList<GolfTeeWomenSlopeRating> WomenSlopeRatings { get; set; }

        // Foreign keys
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfTeeInformation_GolfCourse

        public GolfTeeInformation()
        {
            Priority = 0;
            GolfScores = new List<GolfScore>();
            HoleDistances = new List<GolfTeeHoleDistance>();
            MenSlopeRatings = new List<GolfTeeMenSlopeRating>();
            WomenSlopeRatings = new List<GolfTeeWomenSlopeRating>();
        }

        public double MensRating
        {
            get
            {
                return MenSlopeRatings.Where(s => s.NineHoleIndex == -1).Select(s => s.Rating).SingleOrDefault();
            }
        }

        public double MensSlope
        {
            get
            {
                return MenSlopeRatings.Where(s => s.NineHoleIndex == -1).Select(s => s.Slope).SingleOrDefault();
            }
        }

        public double WomensRating
        {
            get
            {
                return WomenSlopeRatings.Where(s => s.NineHoleIndex == -1).Select(s => s.Rating).SingleOrDefault();
            }
        }

        public double WomensSlope
        {
            get
            {
                return WomenSlopeRatings.Where(s => s.NineHoleIndex == -1).Select(s => s.Slope).SingleOrDefault();
            }
        }

        public double GetSlope(bool isFemale, int holesPlayed)
		{
			double courseSlope = 0.0;


			if (isFemale)
			{
                if (WomenSlopeRatings.Any())
                {
                    if (holesPlayed == 9)
                    {
                        var womenSlopeFront9 = WomenSlopeRatings.Where(s => s.NineHoleIndex == 0).Select(s => s.Slope).SingleOrDefault();
                        if (womenSlopeFront9 != 0)
                            courseSlope = womenSlopeFront9;
                    }

                    // there was no 9 hole slope index.
                    if (courseSlope == 0.0)
                    {
                        var womenSlope = WomensSlope;
                        if (womenSlope != 0)
                            courseSlope = womenSlope;
                    }
                }
			}

			// isn't female or don't have women ratings separate.
			if (courseSlope == 0.0)
			{
                if (holesPlayed == 9)
                {
                    var menSlopeFront9 = MenSlopeRatings.Where(s => s.NineHoleIndex == 0).Select(s => s.Slope).SingleOrDefault();
                    if (menSlopeFront9 != 0)
                        courseSlope = menSlopeFront9;
                }

                // there was no 9 hole slope index.
                if (courseSlope == 0.0)
                {
                    var menSlope = MensSlope;
                    if (menSlope != 0)
                        courseSlope = menSlope;
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
                    var womenRatingFront9 = WomenSlopeRatings.Where(s => s.NineHoleIndex == 0).Select(s => s.Rating).SingleOrDefault();
                    if (womenRatingFront9 != 0)
						courseRating = womenRatingFront9 * 2.0;
				}

				if (courseRating == 0.0)
				{
                    var womenRating = WomensRating;
                    if (womenRating != 0)
					{
						if (GolfCourse.NumberOfHoles == 9)
							courseRating = womenRating * 2.0;
						else
							courseRating = womenRating;
					}
				}
			}

			// isn't female or don't have women ratings separate.
			if (courseRating == 0.0)
			{
				if (holesPlayed == 9)
				{
                    var menRatingFront9 = MenSlopeRatings.Where(s => s.NineHoleIndex == 0).Select(s => s.Rating).SingleOrDefault();
                    if (menRatingFront9 != 0)
						courseRating = menRatingFront9 * 2.0;
				}

				if (courseRating == 0.0)
				{
                    var menRating = MensRating;
                    if (menRating != 0)
					{
						// 9 hole course should have 9 hole rating.
						if (GolfCourse.NumberOfHoles == 9)
							courseRating = menRating * 2.0;
						else
							courseRating = menRating;
					}
				}
			}

			return courseRating;
		}

        public int HoleDistance(int holeNo)
        {
            var holeDistance = (from hd in HoleDistances
                                where hd.HoleNo == holeNo
                                select hd).SingleOrDefault();
            if (holeDistance != null)
                return holeDistance.Distance;

            return 0;
        }

        public void SetHoleDistance(int holeNo, int distance)
        {
            var holeDistance = (from hd in HoleDistances
                                where hd.HoleNo == holeNo
                                select hd).SingleOrDefault();
            if (holeDistance != null)
                holeDistance.Distance = distance;
        }
    }
}
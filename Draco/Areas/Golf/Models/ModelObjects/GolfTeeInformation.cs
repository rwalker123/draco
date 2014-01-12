
namespace SportsManager.Model
{
	public partial class GolfTeeInformation
	{
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
	}
}
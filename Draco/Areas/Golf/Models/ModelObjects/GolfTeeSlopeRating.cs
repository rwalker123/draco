namespace SportsManager.Models
{
    public class GolfTeeSlopeRating
    {
        public long Id { get; set; } // Id (Primary key)
        public long GolfTeeId { get; set; }
        public double Rating { get; set; }
        public double Slope { get; set; }
        public int NineHoleIndex { get; set; }

        public virtual GolfTeeInformation Tee { get; set; }
    }

    public class GolfTeeMenSlopeRating : GolfTeeSlopeRating
    {
    }

    public class GolfTeeWomenSlopeRating : GolfTeeSlopeRating
    {
    }
}
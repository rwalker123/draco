namespace SportsManager.Models
{
    public class GolfTeeHoleDistance
    {
        public long Id { get; set; } // Id (Primary key)
        public long GolfTeeId { get; set; }
        public int HoleNo { get; set; }
        public int Distance { get; set; }

        public virtual GolfTeeInformation Tee { get; set; }
    }
}
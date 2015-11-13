namespace SportsManager.Models
{
    public class GolfCourseHandicap
    {
        public long Id { get; set; } // Id (Primary key)
        public long GolfCourseId { get; set; }
        public int HoleNo { get; set; }
        public int Handicap { get; set; }

        public virtual GolfCourse Course { get; set; }
    }

    public class GolfCourseMenHandicap : GolfCourseHandicap
    {
    }

    public class GolfCourseWomenHandicap : GolfCourseHandicap
    {
    }
}
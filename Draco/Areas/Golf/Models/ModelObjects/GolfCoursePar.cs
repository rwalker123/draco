namespace SportsManager.Golf.Models
{
    public class GolfCoursePar
    {
        public long Id { get; set; } // Id (Primary key)
        public long GolfCourseId { get; set; }
        public int HoleNo { get; set; }
        public int Par { get; set; }
        public int Handicap { get; set; }

        public virtual GolfCourse Course { get; set; }
    }

    public class GolfCourseMenPar : GolfCoursePar
    {
    }

    public class GolfCourseWomenPar : GolfCoursePar
    {
    }
}
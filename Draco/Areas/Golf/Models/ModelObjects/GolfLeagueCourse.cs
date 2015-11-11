using ModelObjects;

namespace SportsManager.Models
{
    public class GolfLeagueCourse
    {
        public long AccountId { get; set; } // AccountId (Primary key)
        public long CourseId { get; set; } // CourseId (Primary key)
        public long? DefaultMensTee { get; set; } // DefaultMensTee
        public long? DefaultWomansTee { get; set; } // DefaultWomansTee

        // Foreign keys
        public virtual Account Account { get; set; } // FK_GolfLeagueCourses_Accounts
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfLeagueCourses_GolfCourse
    }
}
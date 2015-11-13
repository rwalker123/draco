using ModelObjects;

namespace SportsManager.Golf.Models
{
    public class GolfCourseForContact
    {
        public long Id { get; set; } // Id (Primary key)
        public long ContactId { get; set; } // ContactId
        public long CourseId { get; set; } // CourseId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_GolfCourseForContact_Contacts
        public virtual GolfCourse GolfCourse { get; set; } // FK_GolfCourseForContact_GolfCourse
    }
}
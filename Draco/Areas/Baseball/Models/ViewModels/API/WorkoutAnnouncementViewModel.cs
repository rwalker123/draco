using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SportsManager.Baseball.ViewModels.API
{
    public class WorkoutAnnouncementViewModel
    {
        public long Id { get; set; }
        public long AccountId { get; set; }
        public String Comments { get; set; }
        public String Description { get; set; } 
        public DateTime WorkoutDate { get; set; } 
        public long WorkoutLocation { get; set; } 
    }

    public class WorkoutAnnouncementRegisteredViewModel : WorkoutAnnouncementViewModel
    {
        public int NumRegistered { get; set; } 
        public String FieldName { get; set; }
    }
}
using System;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for WorkoutAnnouncement
	/// </summary>
	public class WorkoutAnnouncement
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string WorkoutDesc { get; set; } // WorkoutDesc
        public DateTime WorkoutDate { get; set; } // WorkoutDate
        public long FieldId { get; set; } // FieldId
        public string Comments { get; set; } // Comments

        // Reverse navigation
        public virtual ICollection<WorkoutRegistrant> WorkoutRegistrations { get; set; } // WorkoutRegistration.FK_WorkoutRegistration_WorkoutAnnouncement

        // Foreign keys
        public virtual Account Account { get; set; } // FK_WorkoutAnnouncement_Accounts
        public virtual Field AvailableField { get; set; } // FK_WorkoutAnnouncement_AvailableFields

        public WorkoutAnnouncement()
        {
            WorkoutRegistrations = new List<WorkoutRegistrant>();
        }
    }
}


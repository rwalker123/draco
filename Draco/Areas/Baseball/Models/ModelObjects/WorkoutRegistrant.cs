using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for WorkoutRegistrant
	/// </summary>
	public class WorkoutRegistrant
	{
        public long Id { get; set; } // id (Primary key)
        public string Name { get; set; } // Name
        public string EMail { get; set; } // EMail
        public int Age { get; set; } // Age
        public string Phone1 { get; set; } // Phone1
        public string Phone2 { get; set; } // Phone2
        public string Phone3 { get; set; } // Phone3
        public string Phone4 { get; set; } // Phone4
        public string Positions { get; set; } // Positions
        public bool IsManager { get; set; } // IsManager
        public long WorkoutId { get; set; } // WorkoutId
        public DateTime DateRegistered { get; set; } // DateRegistered
        public string WhereHeard { get; set; } // WhereHeard

        // Foreign keys
        public virtual WorkoutAnnouncement WorkoutAnnouncement { get; set; } // FK_WorkoutRegistration_WorkoutAnnouncement
    }
}

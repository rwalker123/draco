using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for WorkoutAnnouncement
	/// </summary>
	public class WorkoutAnnouncement
	{
		public WorkoutAnnouncement()
		{
		}

		public WorkoutAnnouncement(long id, long accountId, string description,
			DateTime workoutDate, DateTime workoutTime, long workoutLocation, 
            string comments)
		{
			Id = id;
			AccountId = accountId;
			Description = description;
			WorkoutDate = workoutDate;
			WorkoutLocation = workoutLocation;
			Comments = comments;
		}

		public long Id
		{
			get;
			set;
		}

		public long AccountId
		{
			get;
			set;
		}

        public string Description
        {
            get;
            set;
        }

        public DateTime WorkoutDate
        {
            get;
            set;
        }

        public long WorkoutLocation
        {
            get;
            set;
        }

        public string Comments
        {
            get;
            set;
        }

        public int NumRegistered
        {
            get;
            set;
        }
	}
}


using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for WorkoutAnnouncement
	/// </summary>
	public class WorkoutAnnouncement
	{
		private long m_id;
		private long m_accountId;
		private string m_description;
		private DateTime m_workoutDate;
		private DateTime m_workoutTime;
		private long m_workoutLocation;
		private string m_comments;

		public WorkoutAnnouncement()
		{
		}

		public WorkoutAnnouncement(long id, long accountId, string description,
			DateTime workoutDate, DateTime workoutTime, long workoutLocation, 
            string comments)
		{
			m_id = id;
			m_accountId = accountId;
			m_description = description;
			m_workoutDate = workoutDate;
			m_workoutTime = workoutTime;
			m_workoutLocation = workoutLocation;
			m_comments = comments;
		}

		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}

		public long AccountId
		{
			get { return m_accountId; }
			set { m_accountId = value; }
		}

		public string Description
		{
			get { return m_description; }
			set { m_description = value; }
		}

		public DateTime WorkoutDate
		{
			get { return m_workoutDate; }
			set { m_workoutDate = value; }
		}

		public DateTime WorkoutTime
		{
			get { return m_workoutTime; }
			set { m_workoutTime = value; }
		}

		public long WorkoutLocation
		{
			get { return m_workoutLocation; }
			set { m_workoutLocation = value; }
		}

		public string Comments
		{
			get { return m_comments; }
			set { m_comments = value; }
		}

        public int NumRegistered
        {
            get;
            set;
        }
	}
}


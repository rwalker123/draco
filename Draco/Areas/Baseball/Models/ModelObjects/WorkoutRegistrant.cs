using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for WorkoutRegistrant
	/// </summary>
	public class WorkoutRegistrant
	{
		public WorkoutRegistrant()
		{
		}

		public WorkoutRegistrant(long id, string name, string email, int age,
			string phone1, string phone2, string phone3, string phone4,
			string positions, bool manager, long workoutId, string whereHeard, DateTime dateRegistered)
		{
			Id = id;
			Name = name;
			Email = email;
			Age = age;
			Phone1 = phone1;
			Phone2 = phone2;
			Phone3 = phone3;
			Phone4 = phone4;
			Positions = positions;
			WantToManager = manager;
			WorkoutId = workoutId;
			DateRegistered = dateRegistered;
            WhereHeard = whereHeard;
		}

		public long Id { get; set; }
		public string Name { get; set; }
		public string Email { get; set; }
		public int Age { get; set; }
		public string Phone1 { get; set; }
		public string Phone2 { get; set; }
		public string Phone3 { get; set; }
		public string Phone4 { get; set; }
		public string Positions { get; set; }
		public bool WantToManager { get; set; }
		public long WorkoutId { get; set; }
		public DateTime DateRegistered { get; set; }
        public string WhereHeard { get; set; }
	}
}

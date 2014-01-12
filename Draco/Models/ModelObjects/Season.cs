using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Season
	/// </summary>
	public class Season : IComparable
	{
		public Season()
		{
		}

		public Season(Season t)
		{
			Id = t.Id;
			Name = t.Name;
		}

		public Season(long seasonId, string seasonName, long accountId)
		{
			AccountId = accountId;
			Id = seasonId;
			Name = seasonName;
		}

		public long Id { get; set; }
		public long AccountId { get; set; }
		public string Name { get; set; }

		public int CompareTo(Object o)
		{
			Season s = (Season)o;

			return Name.CompareTo(s.Name);
		}
	}
}
using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Affiliation
	/// </summary>
	public class Affiliation
	{
		private long m_id = 0;
		private string m_name = string.Empty;

		public Affiliation()
		{
		}

		public Affiliation(long id, string name )
		{
			m_id = id;
			m_name = name;
		}

		public long Id { get; set; }
		public string Name { get; set;}
	}
}

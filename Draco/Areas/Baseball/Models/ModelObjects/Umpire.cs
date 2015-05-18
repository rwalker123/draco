using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for TeamManager
	/// </summary>
	public class Umpire
	{
		public Umpire()
		{
		}

        public long Id { get; set; }
		public long AccountId { get; set; }
        public long ContactId { get; set; }

        public virtual Contact Contact { get; set; }
	}
}
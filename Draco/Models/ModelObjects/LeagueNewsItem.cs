using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for LeagueNewsItem.
	/// </summary>
	public partial class LeagueNewsItem
	{
		public LeagueNewsItem()
		{
		}

		public long Id { get; set; }
		public long AccountId { get; set; }
		public DateTime Date { get; set; }
		public String Title { get; set; }
		public String Text { get; set; }
		public bool SpecialAnnounce { get; set; }
	}
}

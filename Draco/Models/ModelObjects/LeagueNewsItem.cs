using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for LeagueNewsItem.
	/// </summary>
	public partial class LeagueNewsItem
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public DateTime Date { get; set; } // Date
        public string Title { get; set; } // Title
        public string Text { get; set; } // Text
        public bool SpecialAnnounce { get; set; } // SpecialAnnounce

        // Foreign keys
        public virtual Account Account { get; set; } // FK_LeagueNews_Accounts
    }
}

using System;

namespace ModelObjects
{
    class TeamNewsItem
    {
        public long Id { get; set; } // Id (Primary key)
        public long TeamId { get; set; } // TeamId
        public DateTime Date { get; set; } // Date
        public string Text { get; set; } // Text
        public string Title { get; set; } // Title
        public bool SpecialAnnounce { get; set; } // SpecialAnnounce

        // Foreign keys
        public virtual Team Team { get; set; } // FK_TeamNews_Teams
    }
}

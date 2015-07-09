using System;

namespace SportsManager.ViewModels.API
{
    public class MessagePostViewModel
    {
        public long Id { get; set;}
        public long TopicId { get; set; }
        public int Order { get; set; }
        public long CreatorContactId { get; set; }
        public String CreatorName { get; set; }
        public DateTime CreateDate { get; set; }
        public DateTime EditDate { get; set; }
        public String Subject { get; set; }
        public long CategoryId { get; set; }
        public String Text { get; set; }
    }
}
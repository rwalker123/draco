using System;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.ViewModels.API
{
    public class MessageTopicViewModel
    {
        public long Id { get; set; }
        public long CategoryId { get; set; }
        public long CreatorContactId { get; set; }
        public String PhotoUrl { get; set; }
        public String CreatorName { get; set; }
        public DateTime CreateDate { get; set; }
        [Required]
        [StringLength(255, MinimumLength=1)]
        public String TopicTitle { get; set; }
        public bool StickyTopic { get; set; }
        public int NumberOfViews { get; set; }
        public MessagePostViewModel LastPost { get; set; }
        public int NumberOfReplies  { get; set; }
    }
}
using System;
using System.Collections.Generic;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageTopc
    /// </summary>
    public class MessageTopic
    {
        public long Id { get; set; } // id (Primary key)
        public long CategoryId { get; set; } // CategoryId
        public long ContactCreatorId { get; set; } // ContactCreatorId
        public DateTime TopicCreateDate { get; set; } // TopicCreateDate
        public string Topic { get; set; } // Topic
        public bool StickyTopic { get; set; } // StickyTopic
        public long NumberOfViews { get; set; } // NumberOfViews

        // Reverse navigation
        public virtual ICollection<MessagePost> MessagePosts { get; set; } // MessagePost.FK_MessagePost_MessageTopic

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_MessageTopic_Contacts
        public virtual MessageCategory MessageCategory { get; set; } // FK_MessageTopic_MessageCategory

        public MessageTopic()
        {
            MessagePosts = new List<MessagePost>();
        }
    }
}
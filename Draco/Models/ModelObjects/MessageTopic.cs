using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageTopc
    /// </summary>
    public class MessageTopic
    {
        public MessageTopic()
        {
            Posts = new Collection<MessagePost>();
        }

        public long Id
        {
            get;
            set;
        }

        public long CategoryId
        {
            get;
            set;
        }

        public long CreatorContactId
        {
            get;
            set;
        }

        public DateTime CreateDate
        {
            get;
            set;
        }

        public bool StickyTopic
        {
            get;
            set;
        }

        public string TopicTitle
        {
            get;
            set;
        }

        public long NumberOfViews
        {
            get;
            set;
        }

        // TODO: LastPost can be retrieved by sorting
        public virtual ICollection<MessagePost> Posts { get; set; }
        public virtual MessageCategory Category { get; set; }
    }
}
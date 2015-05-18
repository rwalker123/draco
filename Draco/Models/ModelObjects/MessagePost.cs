using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessagePost
    /// </summary>
    public class MessagePost
    {
        public MessagePost()
        {
        }

        public long Id
        {
            get;
            set;
        }

        public long TopicId
        {
            get;
            set;
        }

        public int Order
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

        public string Text
        {
            get;
            set;
        }

        public DateTime EditDate
        {
            get;
            set;
        }

        public string Subject
        {
            get;
            set;
        }

        public virtual Contact Creator { get; set; }
        public virtual MessageTopic Topic { get; set; }
    }
}
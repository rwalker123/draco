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

        public MessagePost(long id, long topicId, int postOrder, long creatorContactId, 
                            DateTime postDate, string postText, DateTime editDate,
                            string subject, long catId)
        {
            Id = id;
            TopicId = topicId;
            Order = postOrder;
            CreatorContactId = creatorContactId;
            CreateDate = postDate;
            Text = postText;
            EditDate = editDate;
            Subject = subject;
            CategoryId = catId;
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

        public String CreatorName
        {
            get;
            set;
        }

        public String PhotoUrl
        {
            get
            {
                return ModelObjects.Contact.GetPhotoURL(CreatorContactId);
            }
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

        public long CategoryId
        {
            get;
            set;
        }
    }
}
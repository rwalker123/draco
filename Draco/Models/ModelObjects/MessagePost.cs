using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessagePost
    /// </summary>
    public class MessagePost
    {
        private long m_id;
        private long m_topicId;
        private int m_postOrder;
        private long m_creatorContactId;
        private DateTime m_postDate;
        private string m_text;
        private DateTime m_editDate;
        private string m_subject;
        private long m_categoryId;

        public MessagePost()
        {
        }

        public MessagePost(long id, long topicId, int postOrder, long creatorContactId, 
                            DateTime postDate, string postText, DateTime editDate,
                            string subject, long catId)
        {
            m_id = id;
            m_topicId = topicId;
            m_postOrder = postOrder;
            m_creatorContactId = creatorContactId;
            m_postDate = postDate;
            m_text = postText;
            m_editDate = editDate;
            m_subject = subject;
            m_categoryId = catId;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long TopicId
        {
            get { return m_topicId; }
            set { m_topicId = value; }
        }

        public int Order
        {
            get { return m_postOrder; }
            set { m_postOrder = value; }
        }

        public long CreatorContactId
        {
            get { return m_creatorContactId; }
            set { m_creatorContactId = value; }
        }

        public DateTime CreateDate
        {
            get { return m_postDate; }
            set { m_postDate = value; }
        }

        public string Text
        {
            get { return m_text; }
            set { m_text = value; }
        }

        public DateTime EditDate
        {
            get { return m_editDate; }
            set { m_editDate = value; }
        }

        public string Subject
        {
            get { return m_subject; }
            set { m_subject = value; }
        }

        public long CategoryId
        {
            get { return m_categoryId; }
            set { m_categoryId = value; }
        }
    }
}
using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageTopc
    /// </summary>
    public class MessageTopic
    {
        private long m_id;
        private long m_categoryId;
        private long m_creatorContactId;
        private DateTime m_createDate;
        private string m_topicTitle;
        private bool m_stickyTopic;
        private long m_numberOfViews;

        private MessagePost m_lastPost;
        private int m_numberOfReplies;

        public MessageTopic()
        {
        }

        public MessageTopic(long id, long categoryId, long creatorContactId, DateTime createDate, string topicTitle, bool stickyTopic, long numberOfViews)
        {
            m_id = id;
            m_categoryId = categoryId;
            m_creatorContactId = creatorContactId;
            m_createDate = createDate;
            m_topicTitle = topicTitle;
            m_stickyTopic = stickyTopic;
            m_numberOfViews = numberOfViews;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long CategoryId
        {
            get { return m_categoryId; }
            set { m_categoryId = value; }
        }

        public long CreatorContactId
        {
            get { return m_creatorContactId; }
            set { m_creatorContactId = value; }
        }

        public DateTime CreateDate
        {
            get { return m_createDate; }
            set { m_createDate = value; }
        }

        public bool StickyTopic
        {
            get { return m_stickyTopic; }
            set { m_stickyTopic = value; }
        }

        public string TopicTitle
        {
            get { return m_topicTitle; }
            set { m_topicTitle = value; }
        }

        public long NumberOfViews
        {
            get { return m_numberOfViews; }
            set { m_numberOfViews = value; }
        }

        public MessagePost LastPost
        {
            get { return m_lastPost; }
            set { m_lastPost = value; }
        }

        public int NumberOfReplies
        {
            get { return m_numberOfReplies; }
            set { m_numberOfReplies = value; }
        }

        public static int CompareMessageTopicByLastPostDate(MessageTopic topic1, MessageTopic topic2)
        {
            if (topic1 == null || topic1.LastPost == null)
            {
                if (topic2 == null || topic2.LastPost == null)
                {
                    // If topic1 is null and topic2 is null, they're
                    // equal. 
                    return 0;
                }
                else
                {
                    // If topic1 is null and topic2 is not null, topic2
                    // is greater. 
                    return 1;
                }
            }
            else
            {
                // If topic1 is not null...
                //
                if (topic2 == null || topic2.LastPost == null)
                // ...and topic2 is null, topic1 is greater.
                {
                    return -1;
                }
                else
                {
                    // ...and topic2 is not null, compare the 
                    // lengths of the two strings.
                    //
                    int retVal = topic1.LastPost.CreateDate.CompareTo(topic2.LastPost.CreateDate);
                    if (retVal == 1)
                        retVal = -1;
                    else if (retVal == -1)
                        retVal = 1;

                    return retVal;
                }
            }
        }
    }
}
using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageTopc
    /// </summary>
    public class MessageTopic
    {
        public MessageTopic()
        {
        }

        public MessageTopic(long id, long categoryId, long creatorContactId, DateTime createDate, string topicTitle, bool stickyTopic, long numberOfViews)
        {
            Id = id;
            CategoryId = categoryId;
            CreatorContactId = creatorContactId;
            CreateDate = createDate;
            TopicTitle = topicTitle;
            StickyTopic = stickyTopic;
            NumberOfViews = numberOfViews;
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

        public MessagePost LastPost
        {
            get;
            set;
        }

        public int NumberOfReplies
        {
            get;
            set;
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
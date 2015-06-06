using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessagePost
    /// </summary>
    public class MessagePost
    {
        public long Id { get; set; } // id (Primary key)
        public long TopicId { get; set; } // TopicId
        public int PostOrder { get; set; } // PostOrder
        public long ContactCreatorId { get; set; } // ContactCreatorId
        public DateTime PostDate { get; set; } // PostDate
        public string PostText { get; set; } // PostText
        public DateTime EditDate { get; set; } // EditDate
        public string PostSubject { get; set; } // PostSubject
        public long CategoryId { get; set; } // CategoryId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_MessagePost_Contacts
        public virtual MessageTopic MessageTopic { get; set; } // FK_MessagePost_MessageTopic
    }
}
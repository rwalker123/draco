using System.Collections.Generic;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageCategory
    /// </summary>
    public class MessageCategory
    {
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public int CategoryOrder { get; set; } // CategoryOrder
        public string CategoryName { get; set; } // CategoryName
        public string CategoryDescription { get; set; } // CategoryDescription
        public bool AllowAnonymousPost { get; set; } // AllowAnonymousPost
        public bool AllowAnonymousTopic { get; set; } // AllowAnonymousTopic
        public bool IsTeam { get; set; } // isTeam
        public bool IsModerated { get; set; } // isModerated

        // Reverse navigation
        public virtual ICollection<MessageTopic> MessageTopics { get; set; } // MessageTopic.FK_MessageTopic_MessageCategory

        public MessageCategory()
        {
            MessageTopics = new List<MessageTopic>();
        }
    }
}
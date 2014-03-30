using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageCategory
    /// </summary>
    public class MessageCategory
    {
        public MessageCategory()
        {
        }

        public MessageCategory(long id, long accountId, int order, string name, string description, bool allowAnonymousPost, bool allowAnonymousTopic, bool isTeam, bool isModerated)
        {
            Id = id;
            AccountId = accountId;
            Order = order;
            Name = name;
            Description = description;
            AllowAnonymousPost = allowAnonymousPost;
            AllowAnonymousTopic = allowAnonymousTopic;
            IsTeam = isTeam;
            IsModerated = isModerated;
        }

        public long Id
        {
            get;
            set;
        }

        public long AccountId
        {
            get;
            set;
        }

        public int Order
        {
            get;
            set;
        }

        public string Name
        {
            get;
            set;
        }

        public string Description
        {
            get;
            set;
        }

        public bool AllowAnonymousPost
        {
            get;
            set;
        }

        public bool AllowAnonymousTopic
        {
            get;
            set;
        }

        public bool IsTeam
        {
            get;
            set;
        }

        public bool IsModerated
        {
            get;
            set;
        }

        public long NumberOfThreads
        {
            get;
            set;
        }

        public ModelObjects.MessagePost LastPost
        {
            get;
            set;
        }
    }
}
using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for MessageCategory
    /// </summary>
    public class MessageCategory
    {
        private long m_id;
        private long m_accountId;
        private int m_categoryOrder;
        private string m_categoryName;
        private string m_categoryDescription;
        private bool m_allowAnonymousPost;
        private bool m_allowAnonymousTopic;
        private bool m_isModerated;
        private bool m_isTeam;

        private ModelObjects.MessagePost m_lastPost;
        private long m_numThreads;

        public MessageCategory()
        {
        }

        public MessageCategory(long id, long accountId, int order, string name, string description, bool allowAnonymousPost, bool allowAnonymousTopic, bool isTeam, bool isModerated)
        {
            m_id = id;
            m_accountId = accountId;
            m_categoryOrder = order;
            m_categoryName = name;
            m_categoryDescription = description;
            m_allowAnonymousPost = allowAnonymousPost;
            m_allowAnonymousTopic = allowAnonymousTopic;
            m_isTeam = isTeam;
            m_isModerated = isModerated;
        }

        public long Id
        {
            get { return m_id; }
            set { m_id = value; }
        }

        public long AccountId
        {
            get { return m_accountId; }
            set { m_accountId = value; }
        }

        public int Order
        {
            get { return m_categoryOrder; }
            set { m_categoryOrder = value; }
        }

        public string Name
        {
            get { return m_categoryName; }
            set { m_categoryName = value; }
        }

        public string Description
        {
            get { return m_categoryDescription; }
            set { m_categoryDescription = value; }
        }

        public bool AllowAnonymousPost
        {
            get { return m_allowAnonymousPost; }
            set { m_allowAnonymousPost = value; }
        }

        public bool AllowAnonymousTopic
        {
            get { return m_allowAnonymousTopic; }
            set { m_allowAnonymousTopic = value; }
        }

        public bool IsTeam
        {
            get { return m_isTeam; }
            set { m_isTeam = value; }
        }

        public bool IsModerated
        {
            get { return m_isModerated; }
            set { m_isModerated = value; }
        }

        public long NumberOfThreads
        {
            get { return m_numThreads; }
            set { m_numThreads = value; }
        }

        public ModelObjects.MessagePost LastPost
        {
            get { return m_lastPost; }
            set { m_lastPost = value; }
        }
    }
}
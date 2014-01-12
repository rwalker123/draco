using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for RoleDefinition
    /// </summary>
    public class RoleDefinition
    {
        private string m_roleName;
        private string m_description;
        
        public RoleDefinition()
        {
        }

        public RoleDefinition(string roleName, string description)
        {
            m_roleName = roleName;
            m_description = description;
        }

        public string Name
        {
            get { return m_roleName; }
            set { m_roleName = value; }
        }

        public string Description
        {
            get { return m_description; }
            set { m_description = value; }
        }
    }
}
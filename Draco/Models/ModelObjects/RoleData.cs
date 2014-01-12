using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for RoleData
    /// </summary>
    public class RoleData
    {
        private string m_text;
        private long m_data;

        public RoleData()
        {
        }

        public RoleData(String text, long data)
        {
            m_text = text;
            m_data = data;
        }

        public string Text
        {
            get { return m_text; }
            set { m_text = value; }
        }

        public long Data
        {
            get { return m_data; }
            set { m_data = value; }
        }
    }
}
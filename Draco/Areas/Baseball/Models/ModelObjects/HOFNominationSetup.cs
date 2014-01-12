using System;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for HOFNominationSetup
    /// </summary>
    public class HOFNominationSetup
    {
        private long m_accountId = 0;
        private bool m_enableNomination = false;
        private string m_criteriaText = String.Empty;

        public HOFNominationSetup()
        {
        }

        public HOFNominationSetup(long accountId, bool enableNomination, string criteriaText)
        {
            m_accountId = accountId;
            m_enableNomination = enableNomination;
            m_criteriaText = criteriaText;
        }

        public long AccountId
        {
            get { return m_accountId; }
            set { m_accountId = value; }
        }

        public bool EnableNomination
        {
            get { return m_enableNomination; }
            set { m_enableNomination = value; }
        }

        public string CriteriaText
        {
            get { return m_criteriaText; }
            set { m_criteriaText = value; }
        }
    }
}
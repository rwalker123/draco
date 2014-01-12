using System;
using System.Configuration;
using System.Collections.Generic;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for AccountSettings
    /// </summary>
    public class AccountSettings
    {
        Dictionary<string, string> m_settings = new Dictionary<string, string>();

        public AccountSettings()
        {
        }

        public long AccountId { get; set; }

        public AccountSettings(long accountId)
        {
            AccountId = accountId;
        }

        public void AddSetting(string key, string value)
        {
            m_settings[key] = value;
        }

        public string GetSetting(string key)
        {
            return m_settings[key];
        }

        public Dictionary<string, string> KeyValues
        {
            get { return m_settings; }
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileCategoryItem
/// </summary>
	public class ProfileCategoryItem
	{
		private long m_id;
		private long m_accountId;
		private string m_category = String.Empty;
		private int m_priority = 0;

		public ProfileCategoryItem()
		{
		}

		public ProfileCategoryItem(long id, string category, int priority, long accountId)
		{
			m_id = id;
			m_accountId = accountId;
			m_category = category;
			m_priority = priority;
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

		public string CategoryName
		{
			get { return m_category; }
			set { m_category = value; }
		}

		public int Priority
		{
			get { return m_priority; }
			set { m_priority = value; }
		}

        public IEnumerable<ProfileQuestionItem> Questions
        {
            get;
            set;
        }
	}
}
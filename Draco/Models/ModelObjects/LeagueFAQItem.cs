using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for LeagueFAQItem
/// </summary>
	public class LeagueFAQItem
	{
		public LeagueFAQItem()
		{
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

		public string Question
		{
            get;
            set;
        }

		public string Answer
		{
            get;
            set;
        }
	}
}
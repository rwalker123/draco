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

		public LeagueFAQItem(long faqId, string faqQuestion, string faqAnswer, long accountId)
		{
			AccountId = accountId;
		    Id = faqId;
			Question = faqQuestion;
			Answer = faqAnswer;
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
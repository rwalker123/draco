using System;
using System.Collections.Generic;
using System.Linq;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteQuestion
/// </summary>
	public class VoteQuestion
	{
		public VoteQuestion()
		{
		}

		public VoteQuestion(long id, string question, bool active, long accountId)
		{
			Id = id;
			AccountId = accountId;
			Question = question;
			Active = active;
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

		public bool Active
		{
			get;
			set;
		}

        public IEnumerable<VoteResults> Results
        {
            get;
            set;
        }

        public bool HasVoted
        {
            get;
            set;
        }

        public long OptionSelected
        {
            get;
            set;
        }
	}
}
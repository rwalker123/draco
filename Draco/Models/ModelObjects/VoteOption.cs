using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for VoteOption
/// </summary>
	public class VoteOption
	{
		public VoteOption()
		{
		}

		public VoteOption(long id, long questionId, string optionText, int priority)
		{
			QuestionId = questionId;
			Id = id;
			OptionText = optionText;
			Priority = priority;
		}

		public long QuestionId
		{
			get;
			set;
		}

		public long Id
		{
			get;
			set;
		}

		public string OptionText
		{
			get;
			set;
		}

		public int Priority
		{
			get;
			set;
		}

	}
}

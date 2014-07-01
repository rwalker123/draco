using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileQuestionItem
/// </summary>
	public class ProfileQuestionItem
	{
		public ProfileQuestionItem()
		{
		}

		public ProfileQuestionItem(long id, long catId, string question, int num)
		{
			Id = id;
			CategoryId = catId;
			Question = question;
			QuestionNum = num;
		}

		public long Id
		{
			get;
			set;
		}

		public long CategoryId
		{
			get;
			set;
		}

		public string Question
		{
			get;
			set;
		}

		public int QuestionNum
		{
			get;
			set;
		}
	}
}
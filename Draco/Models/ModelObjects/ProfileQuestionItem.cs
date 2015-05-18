using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace ModelObjects
{
/// <summary>
/// Summary description for ProfileQuestionItem
/// </summary>
	public class ProfileQuestionItem
	{
		public ProfileQuestionItem()
		{
            PlayerAnswers = new Collection<PlayerProfile>();
		}

		public ProfileQuestionItem(long id, long catId, string question, int num)
            : this()
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

        public virtual ICollection<PlayerProfile> PlayerAnswers { get; set; }
	}
}
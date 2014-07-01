using System;
using System.Configuration;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for ProfileQuestionAnswer
	/// </summary>
	public class ProfileQuestionAnswer
	{
		public ProfileQuestionAnswer()
		{
		}

		public ProfileQuestionAnswer(long id, long playerId, long questionId, string answer)
		{
            id = Id;
			PlayerId = playerId;
			QuestionId = questionId;
			Answer = answer;
		}

        public long Id
        {
            get;
            set;
        }

        public long PlayerId
        {
            get;
            set;
        }

        public long QuestionId
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

namespace ModelObjects
{
/// <summary>
/// Summary description for PlayerProfile
/// </summary>
	public class PlayerProfile
	{
		public PlayerProfile()
		{
		}

        public long Id { get; set; }

        public long PlayerId { get; set; }

        public long QuestionId { get; set; }

        public string Answer { get; set; }

        public virtual Contact Contact { get; set; }
        public virtual ProfileQuestionItem Question { get; set; }

    }
}

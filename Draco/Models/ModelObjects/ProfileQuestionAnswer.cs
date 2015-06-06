
namespace ModelObjects
{
	/// <summary>
	/// Summary description for ProfileQuestionAnswer
	/// </summary>
	public class ProfileQuestionAnswer
	{
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long QuestionId { get; set; } // QuestionId
        public string Answer { get; set; } // Answer

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_PlayerProfile_Contacts
        public virtual ProfileQuestionItem ProfileQuestion { get; set; } // FK_PlayerProfile_ProfileQuestion
    }
}

namespace ModelObjects
{
    class VoteAnswer
    {
        public long Id { get; set; } // id (Primary key)
        public long QuestionId { get; set; } // QuestionId
        public long OptionId { get; set; } // OptionId
        public long ContactId { get; set; } // ContactId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_VoteAnswers_Contacts
        public virtual VoteOption VoteOption { get; set; } // FK_VoteAnswers_VoteOptions
        public virtual VoteQuestion VoteQuestion { get; set; } // FK_VoteAnswers_VoteQuestion
    }
}

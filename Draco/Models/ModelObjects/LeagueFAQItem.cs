
namespace ModelObjects
{
/// <summary>
/// Summary description for LeagueFAQItem
/// </summary>
	public class LeagueFAQItem
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Question { get; set; } // Question
        public string Answer { get; set; } // Answer

        // Foreign keys
        public virtual Account Account { get; set; } // FK_LeagueFAQ_Accounts
    }
}

namespace ModelObjects
{
/// <summary>
/// Summary description for HOFMember
/// </summary>
	public class HOFMember
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public int YearInducted { get; set; } // YearInducted
        public long ContactId { get; set; } // ContactId
        public string Bio { get; set; } // Bio

        // Foreign keys
        public virtual Account Account { get; set; } // FK_hof_Accounts
        public virtual Contact Contact { get; set; } // FK_hof_Contacts
    }
}
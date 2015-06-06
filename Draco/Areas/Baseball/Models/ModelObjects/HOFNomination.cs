
namespace ModelObjects
{

/// <summary>
/// Summary description for HOFNomination
/// </summary>
	public class HOFNomination
	{
        public long Id { get; set; } // id (Primary key)
        public long AccountId { get; set; } // AccountId
        public string Nominator { get; set; } // Nominator
        public string PhoneNumber { get; set; } // PhoneNumber
        public string EMail { get; set; } // EMail
        public string Nominee { get; set; } // Nominee
        public string Reason { get; set; } // Reason

        // Foreign keys
        public virtual Account Account { get; set; } // FK_HOFNomination_Accounts
    }
}
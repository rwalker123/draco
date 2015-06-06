
namespace ModelObjects
{
    /// <summary>
    /// Summary description for HOFNominationSetup
    /// </summary>
    public class HOFNominationSetup
    {
        public long AccountId { get; set; } // AccountId (Primary key)
        public bool EnableNomination { get; set; } // EnableNomination
        public string CriteriaText { get; set; } // CriteriaText

        // Foreign keys
        public virtual Account Account { get; set; } // FK_HOFNominationSetup_Accounts
    }
}
namespace ModelObjects
{
    /// <summary>
    /// Summary description for AccountURL
    /// </summary>
    public class AccountURL
	{
        public long Id { get; set; } // Id (Primary key)
        public long AccountId { get; set; } // AccountId 
        public string URL { get; set; } // URL

        // Reverse navigation
        public virtual Account Account { get; set; } // Account.FK_AccountsURL_Accounts

        public AccountURL()
        {
        }
	}
}
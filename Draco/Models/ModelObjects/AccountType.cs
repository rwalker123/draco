using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for AccountType
	/// </summary>
	public class AccountType
	{
        public long Id { get; set; } // Id (Primary key)
        public string Name { get; set; } // Name
        public string FilePath { get; set; } // FilePath
        public string FacebookAppId { get; set; } // FacebookAppId
        public string FacebookSecretKey { get; set; } // FacebookSecretKey
        public string TwitterAppId { get; set; } // TwitterAppId
        public string TwitterSecret { get; set; } // TwitterSecret

        // Reverse navigation
        public virtual ICollection<Account> Accounts { get; set; } // Accounts.FK_AccountTypes_Accounts

        public AccountType()
        {
            Accounts = new List<Account>();
        }
    }
}
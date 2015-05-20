using System;
using System.Collections.Generic;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Affiliation
	/// </summary>
	public class Affiliation
	{
        public long Id { get; set; } // Id (Primary key)
        public string Name { get; set; } // Name

        // Reverse navigation
        public virtual ICollection<Account> Accounts { get; set; } // Accounts.FK_Affiliations_Accounts

        public Affiliation()
        {
            Accounts = new List<Account>();
        }
    }
}

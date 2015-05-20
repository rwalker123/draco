using System;
using System.Configuration;

namespace ModelObjects
{
    public class AccountWelcome
    {
        public long Id { get; set; } // Id (Primary key)
        public long AccountId { get; set; } // AccountId
        public short OrderNo { get; set; } // OrderNo
        public string CaptionMenu { get; set; } // CaptionMenu
        public string WelcomeText { get; set; } // WelcomeText
        public long? TeamId { get; set; } // TeamId

        // Foreign keys
        public virtual Account Account { get; set; } // FK_AccountWelcome_Accounts
        public virtual Team Team { get; set; } // FK_AccountWelcome_Teams
    }
}
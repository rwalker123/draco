
namespace ModelObjects
{
    public class AccountSetting
    {
        public long AccountId { get; set; } // AccountId (Primary key)
        public string SettingKey { get; set; } // SettingKey (Primary key)
        public string SettingValue { get; set; } // SettingValue

        // Foreign keys
        public virtual Account Account { get; set; } // FK_AccountSettings_Accounts
    }

}
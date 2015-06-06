
namespace ModelObjects
{
    /// <summary>
    /// Summary description for ContactRole
    /// </summary>
    public class ContactRole
    {
        public long Id { get; set; } // Id (Primary key)
        public long ContactId { get; set; } // ContactId
        public string RoleId { get; set; } // RoleId
        public long RoleData { get; set; } // RoleData
        public long AccountId { get; set; } // AccountId

        // Foreign keys
        public virtual Contact Contact { get; set; } // FK_ContactRoles_Contacts
    }
}

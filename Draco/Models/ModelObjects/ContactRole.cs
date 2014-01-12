using System;
using System.Web.Security;

namespace ModelObjects
{
    /// <summary>
    /// Summary description for ContactRole
    /// </summary>
    public class ContactRole
    {
        public long Id { get; set; }
        public long ContactId { get; set; }
        public String RoleId { get; set; }
        public long RoleData { get; set; }
        public long AccountId { get; set; }

        public ContactRole()
        {
        }

        public ContactRole(long id, long contactId, long accountId, String roleId, long roleData)
        {
            Id = id;
            ContactId = contactId;
            RoleId = roleId;
            RoleData = roleData;
            AccountId = accountId;
        }
    }
}


namespace ModelObjects
{
	/// <summary>
	/// Summary description for FieldContact
	/// </summary>
	public class FieldContact
	{
        public long Id { get; set; } // Id (Primary key)
        public long FieldId { get; set; } // FieldId
        public long ContactId { get; set; } // ContactId

        // Foreign keys
        public virtual Field AvailableField { get; set; } // FK_FieldContacts_AvailableFields
        public virtual Contact Contact { get; set; } // FK_FieldContacts_Contacts
    }
}
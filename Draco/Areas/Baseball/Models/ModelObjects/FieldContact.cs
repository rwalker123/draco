
namespace ModelObjects
{
	/// <summary>
	/// Summary description for FieldContact
	/// </summary>
	public class FieldContact
	{
		private long m_id;
		private long m_fieldId;
		private long m_contactId;

		private Field m_field;
		private Contact m_contact;

		public FieldContact()
		{
		}

		public FieldContact(long id, long fieldId, long contactId)
		{
			m_id = id;
			m_fieldId = fieldId;
			m_contactId = contactId;
		}

		public long Id
		{
			get { return m_id; }
			set { m_id = value; }
		}

		public long FieldId
		{
			get { return m_fieldId; }
			set { m_fieldId = value; }
		}

		public long ContactId
		{
			get { return m_contactId; }
			set { m_contactId = value; }
		}

		public virtual Contact Contact;

        public virtual Field Field;
	}
}
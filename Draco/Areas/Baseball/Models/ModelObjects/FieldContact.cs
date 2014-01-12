
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

		public string FieldName
		{
			get { return Field.Name; }
		}

		public string ContactFullName
		{
			get { return Contact.FullNameFirst; }
		}

		private Contact Contact
		{
			get
			{
				if (m_contact == null)
				{
					m_contact = DataAccess.Contacts.GetContact(m_contactId);
					if (m_contact == null)
						m_contact = new Contact();
				}

				return m_contact;
			}
		}

		private Field Field
		{
			get
			{
				if (m_field == null)
				{
					m_field = DataAccess.Fields.GetField(m_fieldId);
					if (m_field == null)
						m_field = new Field();
				}

				return m_field;
			}
		}
	}
}
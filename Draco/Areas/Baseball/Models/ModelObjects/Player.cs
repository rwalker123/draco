using System;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for Player
	/// </summary>
	public class Player
	{
		public Player()
		{
			DateAdded = DateTime.Now;
		}

		public Player(long pId, long tId, int pNo, Contact contact, bool sWaiver,
			bool sDriversLicense, long accountId, DateTime dateAdded, string affiliationDuesPaid)
		{
			TeamId = tId;
			AccountId = accountId;
			Id = pId;
			PlayerNumber = pNo;

			Contact = contact;

			SubmittedWaiver = sWaiver;
			SubmittedDriversLicense = sDriversLicense;

			DateAdded = dateAdded;

			AffiliationDuesPaid = affiliationDuesPaid;
		}

		public long Id { get; set; }
		public long TeamId { get; set; }
		public long AccountId { get; set; }

		public int PlayerNumber { get; set; }
		public DateTime DateAdded { get; set; }
		public string AffiliationDuesPaid { get; set; }

		public bool SubmittedWaiver { get; set; }
		public bool SubmittedDriversLicense { get; set; }

		public Contact Contact { get; set; }

		public int Age
		{
			get
			{
				if (!Contact.DateOfBirth.HasValue)
					return 0;

				DateTime today = DateTime.Today;

				int years = today.Year - Contact.DateOfBirth.Value.Year;
				if (today.Month == Contact.DateOfBirth.Value.Month)
				{
					if (today.Day < Contact.DateOfBirth.Value.Day)
						years--;
				}
				else if (today.Month < Contact.DateOfBirth.Value.Month)
				{
					years--;
				}

				return years;
			}
		}

	}
}
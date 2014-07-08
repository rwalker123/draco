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
        internal long ContactId { get; set; }

		public int Age
		{
			get
			{
				DateTime today = DateTime.Today;
                if (Contact == null)
                    return 0;

				int years = today.Year - Contact.DateOfBirth.Year;
				if (today.Month == Contact.DateOfBirth.Month)
				{
					if (today.Day < Contact.DateOfBirth.Day)
						years--;
				}
				else if (today.Month < Contact.DateOfBirth.Month)
				{
					years--;
				}

				return years;
			}
		}

	}
}
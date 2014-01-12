
using System.Collections.Generic;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
	public class MemberBusinessViewModel
	{
		public MemberBusinessViewModel(long accountId)
		{
			AccountId = accountId;
			AccountName = DataAccess.Accounts.GetAccountName(accountId);
			MemberBusinesses = DataAccess.MemberDirectory.GetAccountMemberBusiness(accountId);
		}

		public IEnumerable<Sponsor> MemberBusinesses { get; private set; }
		public string AccountName { get; private set; }
		public long AccountId { get; private set; }

	}
}

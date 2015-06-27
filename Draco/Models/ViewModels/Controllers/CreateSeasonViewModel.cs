using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace SportsManager.ViewModels
{
	public class SeasonViewModel
	{
		public SeasonViewModel(long accountId, long seasonId)
		{
            Id = seasonId;
            IsDefault = true;
            AccountId = accountId;
		}

		[ScaffoldColumn(false)]
		public long Id { get; private set; }

        [ScaffoldColumn(false)]
        public long AccountId { get; private set; }

		[Required, DisplayName("Season Name"), StringLength(25)]
		public string Name
		{
			get;
			set;
		}

		[UIHint("SeasonsDropDown"), DisplayName("Copy Existing Season")]
		public long CopyFromSeasonId
		{
			get;
			set;
		}

		[DisplayName("Set as Current Season")]
		public bool IsDefault
		{
			get;
			set;
		}
	}
}
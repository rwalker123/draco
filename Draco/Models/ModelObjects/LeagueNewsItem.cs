using System;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace ModelObjects
{
	/// <summary>
	/// Summary description for LeagueNewsItem.
	/// </summary>
    [MetadataType(typeof(LeagueNewsItem_Validation))]
	public partial class LeagueNewsItem
	{
		public LeagueNewsItem()
		{
		}

		public LeagueNewsItem(long newsId, DateTime newsDate, String newsTitle, String newsText, bool specialAnnounce, long accountId)
		{
			Id = newsId;
			AccountId = accountId;
			Date = newsDate;
			Title = newsTitle;
			Text = newsText;
			SpecialAnnounce = specialAnnounce;
		}

        public void CopyTo(SportsManager.Model.LeagueNew copy)
        {
            copy.Id = Id;
            copy.AccountId = AccountId;
            copy.Date = Date;
            copy.Title = Title;
            copy.Text = Text;
            copy.SpecialAnnounce = SpecialAnnounce;
        }

		public long Id { get; set; }
		public long AccountId { get; set; }
		public DateTime Date { get; set; }
		public String Title { get; set; }
		public String Text { get; set; }
		public bool SpecialAnnounce { get; set; }
	}

    [Bind(Exclude="Id,AccountId")]
    public class LeagueNewsItem_Validation
    {
        [Required(ErrorMessage = "Text is Required")]
        public string Text { get; set; }
    }

}

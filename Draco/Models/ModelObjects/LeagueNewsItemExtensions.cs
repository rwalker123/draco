
namespace ModelObjects
{
    public static class LeagueNewsItemExtensions
    {
        public static void CopyTo(this LeagueNewsItem item, SportsManager.Model.LeagueNew copy)
        {
            copy.Id = item.Id;
            copy.AccountId = item.AccountId;
            copy.Date = item.Date;
            copy.Title = item.Title;
            copy.Text = item.Text;
            copy.SpecialAnnounce = item.SpecialAnnounce;
        }

    }
}
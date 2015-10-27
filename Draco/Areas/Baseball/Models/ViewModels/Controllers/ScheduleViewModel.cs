using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class ScheduleViewModel : AccountViewModel
    {
        public ScheduleViewModel(DBController c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;

            Leagues = c.Db.LeagueSeasons.Where(ls => ls.SeasonId == seasonId);
            Fields = c.Db.AvailableFields.Where(f => f.AccountId == accountId);
            Umpires = c.Db.LeagueUmpires.Where(u => u.AccountId == accountId).Select(u => u.Contact);

            var trackGamesPlayed = false;
            bool.TryParse(c.GetAccountSetting(accountId, "TrackGamesPlayed"), out trackGamesPlayed);
            TrackGamesPlayed = trackGamesPlayed;

            EnableTweet = !String.IsNullOrEmpty(Account.TwitterAccountName);

            TwitterError = (String)c.Session["twitterError"];
            c.Session.Remove("twitterError");
        }

        public String TwitterError { get; private set; }
        public bool EnableTweet { get; private set; }
        public bool TrackGamesPlayed { get; private set; }

        public long SeasonId { get; private set; }

        public IQueryable<Contact> Umpires
        {
            get;
            private set;
        }


        public IQueryable<Field> Fields
        {
            get;
            private set;
        }

        public IQueryable<LeagueSeason> Leagues
        {
            get;
            private set;
        }
    }
}
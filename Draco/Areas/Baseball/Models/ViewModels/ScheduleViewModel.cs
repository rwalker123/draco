using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.Web.Mvc;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class ScheduleViewModel : AccountViewModel
    {
        public ScheduleViewModel(Controller c, long accountId, long seasonId)
            : base(c, accountId)
        {
            SeasonId = seasonId;

            Leagues = DataAccess.Leagues.GetLeagues(seasonId);
            Fields = DataAccess.Fields.GetFields(accountId);
            var umpires = DataAccess.Umpires.GetUmpires(accountId);
            Umpires = new List<Contact>();
            foreach(var u in umpires)
            {
                ((List<Contact>)Umpires).Add(DataAccess.Contacts.GetContact(u.ContactId));
            }

            var trackGamesPlayed = false;
            bool.TryParse(DataAccess.Accounts.GetAccountSetting(accountId, "TrackGamesPlayed"), out trackGamesPlayed);
            TrackGamesPlayed = trackGamesPlayed;

            EnableTweet = !String.IsNullOrEmpty(DataAccess.SocialIntegration.Twitter.TwitterAccountName(accountId));

            TwitterError = (String)c.Session["twitterError"];
            c.Session.Remove("twitterError");
        }

        public String TwitterError { get; private set; }
        public bool EnableTweet { get; private set; }
        public bool TrackGamesPlayed { get; private set; }

        public long SeasonId { get; private set; }

        public IEnumerable<Contact> Umpires
        {
            get;
            private set;
        }


        public IEnumerable<Field> Fields
        {
            get;
            private set;
        }

        public IEnumerable<League> Leagues
        {
            get;
            private set;
        }
    }
}
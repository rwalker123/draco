using System.Collections.Generic;
using ModelObjects;
using SportsManager.ViewModels;
using System.Web.Mvc;

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
        }

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
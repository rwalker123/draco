using SportsManager.Controllers;
using System.Linq;

namespace SportsManager.ViewModels
{
    public class MemberBusinessViewModel : AccountViewModel
    {
        public MemberBusinessViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            long seasonId = c.GetCurrentSeasonId(accountId);
            // if contact is on any roster in the current season, they can have a directory.
            CanCreateBusiness = (from ct in c.Db.Contacts
                                 join r in c.Db.Rosters on ct.Id equals r.ContactId
                                 join rs in c.Db.RosterSeasons on r.Id equals rs.PlayerId
                                 join ts in c.Db.TeamsSeasons on rs.TeamSeasonId equals ts.Id
                                 join ls in c.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                 where ls.SeasonId == seasonId && ct.Id == ContactId
                                 select rs).Any();
        }

        public bool CanCreateBusiness
        {
            get;
            set;
        }
    }
}
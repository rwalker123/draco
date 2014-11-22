using ModelObjects;
using SportsManager;
using System.Linq;

namespace DataAccess
{

    /// <summary>
    /// Summary description for League Events
    /// </summary>
    static public class LeagueEvents
    {
        static public LeagueEvent GetEvent(long eventId)
        {
            DB db = DBConnection.GetContext();

            return (from le in db.LeagueEvents
                    where le.Id == eventId
                    select new LeagueEvent(le.Id, le.LeagueSeasonId, le.EventDate, le.Description)).SingleOrDefault();
        }

        static public IQueryable<LeagueEvent> GetEvents(long leagueSeasonId)
        {
            DB db = DBConnection.GetContext();

            return (from le in db.LeagueEvents
                    where le.LeagueSeasonId == leagueSeasonId
                    orderby le.EventDate
                    select new LeagueEvent(le.Id, le.LeagueSeasonId, le.EventDate, le.Description));
        }

        static public IQueryable<LeagueEvent> GetEvents(long leagueSeasonId, int month)
        {
            //SELECT Id, LeagueSeasonId, EventDate, Description 
            //From LeagueEvents 
            //Where LeagueSeasonId = @leagueId AND MONTH(EventDate) = @month
            DB db = DBConnection.GetContext();

            return (from le in db.LeagueEvents
                    where le.LeagueSeasonId == leagueSeasonId && le.EventDate.Month == month
                    orderby le.EventDate
                    select new LeagueEvent(le.Id, le.LeagueSeasonId, le.EventDate, le.Description));
        }

        static public bool ModifyEvent(LeagueEvent e)
        {
            DB db = DBConnection.GetContext();

            var dbEvent = (from le in db.LeagueEvents
                           where le.Id == e.Id
                           select le).SingleOrDefault();
            if (dbEvent == null)
                return false;

            dbEvent.EventDate = e.EventDate;
            dbEvent.Description = e.Description;
            db.SubmitChanges();

            return true;
        }

        static public bool AddEvent(LeagueEvent e)
        {
            if (e.LeagueId <= 0)
                e.LeagueId = Leagues.GetCurrentLeague();

            DB db = DBConnection.GetContext();

            var dbEvent = new SportsManager.Model.LeagueEvent()
            {
                EventDate = e.EventDate,
                Description = e.Description,
                LeagueSeasonId = e.LeagueId
            };

            db.LeagueEvents.InsertOnSubmit(dbEvent);
            db.SubmitChanges();

            e.Id = dbEvent.Id;

            return true;
        }

        static public bool RemoveEvent(LeagueEvent e)
        {
            DB db = DBConnection.GetContext();

            var dbEvent = (from le in db.LeagueEvents
                           where le.Id == e.Id
                           select le).SingleOrDefault();
            if (dbEvent == null)
                return false;

            db.LeagueEvents.DeleteOnSubmit(dbEvent);
            db.SubmitChanges();

            return true;
        }
    }
}

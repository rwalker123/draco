using ModelObjects;
using SportsManager;
using System.Linq;


namespace DataAccess
{
    /// <summary>
    /// Summary description for GameEjections
    /// </summary>
    public static class GameEjections
    {
        static public GameEjection GetGameEjection(long id)
        {
            DB db = DBConnection.GetContext();

            return (from ge in db.GameEjections
                    where ge.Id == id
                    select new GameEjection(ge.Id, ge.leagueSeasonId, ge.gameId, ge.playerSeasonId, ge.umpireId, ge.comments)).SingleOrDefault();
        }


        static public IQueryable<GameEjection> GetGameEjections(long leagueSeasonId)
        {
            DB db = DBConnection.GetContext();

            if (leagueSeasonId == 0)
                leagueSeasonId = DataAccess.Leagues.GetCurrentLeague();

            return (from ge in db.GameEjections
                    where ge.leagueSeasonId == leagueSeasonId
                    select new GameEjection(ge.Id, ge.leagueSeasonId, ge.gameId, ge.playerSeasonId, ge.umpireId, ge.comments));
        }

        static public bool ModifyGameEjection(GameEjection gameEjection)
        {
            DB db = DBConnection.GetContext();

            var dbEjection = (from ge in db.GameEjections
                              where ge.Id == gameEjection.Id
                              select ge).SingleOrDefault();
            if (dbEjection == null)
                return false;

            dbEjection.umpireId = gameEjection.UmpireId;
            dbEjection.comments = gameEjection.Comments;
            db.SubmitChanges();

            return true;
        }

        static public bool AddGameEjection(GameEjection ge)
        {
            DB db = DBConnection.GetContext();

            var dbEjection = new SportsManager.Model.GameEjection()
            {
                comments = ge.Comments,
                gameId = ge.GameId,
                umpireId = ge.UmpireId,
                leagueSeasonId = ge.LeagueSeasonId,
                playerSeasonId = ge.PlayerSeasonId
            };

            db.GameEjections.InsertOnSubmit(dbEjection);
            db.SubmitChanges();

            ge.Id = dbEjection.Id;

            return true;
        }

        static public bool RemoveGameEjection(GameEjection ge)
        {
            DB db = DBConnection.GetContext();

            var dbGameEjection = (from g in db.GameEjections
                                  where g.Id == ge.Id
                                  select g).SingleOrDefault();

            if (dbGameEjection == null)
                return false;

            db.GameEjections.DeleteOnSubmit(dbGameEjection);
            db.SubmitChanges();

            return true;
        }
    }
}
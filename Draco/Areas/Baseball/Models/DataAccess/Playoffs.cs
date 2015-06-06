using ModelObjects;
using SportsManager;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess
{

    /// <summary>
    /// Summary description for Playoffs
    /// </summary>
    static public class Playoffs
    {
        static public List<KeyValuePair<String, String>> GetTeamPlayoffType()
        {
            var li = new List<KeyValuePair<String, String>>(2);

            li.Add(new KeyValuePair<String, String>("SEED", "Seed #"));
            li.Add(new KeyValuePair<String, String>("BYE", "Bye"));

            return li;
        }

        static public string GetPlayoffName(long id)
        {
            DB db = DBConnection.GetContext();
            return (from p in db.PlayoffSetups
                    where p.Id == id
                    select p.Description).SingleOrDefault();
        }

        static public IQueryable<PlayoffSetup> GetPlayoffs(long seasonId, bool onlyActive)
        {
            //SELECT PlayoffSetup.* 
            //FROM PlayoffSetup LEFT JOIN LeagueSeason ON PlayoffSetup.LeagueSeasonId = LeagueSeason.Id 
            //                  LEFT JOIN League ON LeagueSeason.LeagueId = League.Id
            //WHERE LeagueSeason.SeasonId = @seasonId
            DB db = DBConnection.GetContext();
            return (from ps in db.PlayoffSetups
                    join ls in db.LeagueSeasons on ps.LeagueSeasonId equals ls.Id
                    join l in db.Leagues on ls.LeagueId equals l.Id
                    where ls.SeasonId == seasonId && ((onlyActive && ps.Active) || !onlyActive)
                    select new PlayoffSetup(ps.Id, ps.LeagueSeasonId, ps.NumTeams, ps.Description, ps.Active));
        }

        static public PlayoffSetup GetPlayoffSetup(long playoffId)
        {
            //SELECT PlayoffSetup.* 
            //FROM PlayoffSetup LEFT JOIN LeagueSeason ON PlayoffSetup.LeagueSeasonID = LeagueSeason.ID 
            //                  LEFT JOIN CurrentSeason ON LeagueSeason.SeasonID = CurrentSeason.SeasonId 
            //WHERE PlayoffSetup.Id = @playoffId
            DB db = DBConnection.GetContext();

            return (from ps in db.PlayoffSetups
                    join ls in db.LeagueSeasons on ps.LeagueSeasonId equals ls.Id
                    join cs in db.CurrentSeasons on ls.SeasonId equals cs.SeasonId
                    where ps.Id == playoffId
                    select new PlayoffSetup(ps.Id, ps.LeagueSeasonId, ps.NumTeams, ps.Description, ps.Active)).SingleOrDefault();
        }

        static public bool ModifyPlayoff(PlayoffSetup p)
        {
            //DECLARE @prevNumTeams int
            //SET @prevNumTeams = (SELECT NumTeams FROM PlayoffSetup WHERE Id = @id)
	
            //Update PlayoffSetup 
            //SET LeagueSeasonId = @leagueId, NumTeams = @numTeams, Description = @description, Active = @active
            //WHERE Id = @id	

            //IF @prevNumTeams > @numTeams
            //    DELETE FROM PlayoffSeeds WHERE PlayoffId = @id AND SeedNo > @numTeams 
            //ELSE
            //    WHILE @prevNumTeams < @numTeams
            //    BEGIN
            //        SET @prevNumTeams = @prevNumTeams + 1
            //        INSERT INTO PlayoffSeeds VALUES(@id, 0, @prevNumTeams)
            //    END
            DB db = DBConnection.GetContext();

            var dbPlayoff = (from ps in db.PlayoffSetups
                             where ps.Id == p.Id
                             select ps).SingleOrDefault();
            if (dbPlayoff == null)
                return false;

            var prevNumTeams = dbPlayoff.NumTeams;

            dbPlayoff.LeagueSeasonId = p.LeagueId;
            dbPlayoff.NumTeams = p.NumTeams;
            dbPlayoff.Description = p.Description;
            dbPlayoff.Active = p.Active;
            
            if (prevNumTeams > p.NumTeams)
            {
                var deleteSeeds = (from ps in db.PlayoffSeeds
                                   where ps.PlayoffId == p.Id && ps.SeedNo > p.NumTeams
                                   select ps);
                db.PlayoffSeeds.DeleteAllOnSubmit(deleteSeeds);
            }
            else
            {
                while (prevNumTeams < p.NumTeams)
                {
                    prevNumTeams++;
                    db.PlayoffSeeds.InsertOnSubmit(new SportsManager.Model.PlayoffSeed()
                        {
                            PlayoffId = p.Id,
                            SeedNo = prevNumTeams,
                            TeamId = 0
                        });
                }
            }

            db.SubmitChanges();

            return true;
        }

        static public bool AddPlayoff(PlayoffSetup p)
        {
            //INSERT INTO PlayoffSetup VALUES(@leagueId, @numTeams, @description, @active)

            //DECLARE @id bigint
            //SET @id = @@IDENTITY
	
            //DECLARE @seedNo int
            //SET @seedNo = 1
	
            //WHILE @seedNo <= @numTeams
            //BEGIN
            //    INSERT INTO PlayoffSeeds VALUES(@id, 0, @seedNo)
            //    SET @seedNo = @seedNo + 1
            //END
            DB db = DBConnection.GetContext();

            var dbPlayoffSetup = new SportsManager.Model.PlayoffSetup()
            {
                Active = p.Active,
                Description = p.Description,
                LeagueSeasonId = p.LeagueId,
                NumTeams = p.NumTeams
            };
            db.PlayoffSetups.InsertOnSubmit(dbPlayoffSetup);
            db.SubmitChanges();

            p.Id = dbPlayoffSetup.Id;

            for (int seedNo = 1; seedNo < p.NumTeams; ++seedNo)
            {
                db.PlayoffSeeds.InsertOnSubmit(new SportsManager.Model.PlayoffSeed()
                    {
                        PlayoffId = dbPlayoffSetup.Id,
                        SeedNo = seedNo,
                        TeamId = 0
                    });
            }

            db.SubmitChanges();

            return true;
        }

        static public bool RemovePlayoff(PlayoffSetup p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffSetup = (from ps in db.PlayoffSetups
                                  where ps.Id == p.Id
                                  select ps).SingleOrDefault();
            if (dbPlayoffSetup == null)
                return false;

            db.PlayoffSetups.DeleteOnSubmit(dbPlayoffSetup);
            db.SubmitChanges();
            return true;
        }

        static public IQueryable<PlayoffSeed> GetPlayoffSeeds(long playoffId)
        {
            //SELECT * 
            //FROM PlayoffSeeds 
            //WHERE PlayoffId = @Id ORDER BY SeedNo ASC
            DB db = DBConnection.GetContext();
            return (from ps in db.PlayoffSeeds
                    where ps.PlayoffId == playoffId
                    orderby ps.SeedNo ascending
                    select new PlayoffSeed(ps.Id, ps.PlayoffId, ps.TeamId, ps.SeedNo));
        }

        static public bool ModifyPlayoffSeeds(long playoffId, IList<long> seedIds, IList<long> seedTeamIds)
        {
            int i = 0;
            foreach (int seedId in seedIds)
            {
                if (seedId > 0)
                {
                    ModifyPlayoffSeed(new PlayoffSeed(seedId, playoffId, seedTeamIds[i], i + 1));
                }
                else
                {
                    CreatePlayoffSeed(new PlayoffSeed(0, playoffId, seedTeamIds[i], i + 1));
                }

                i++;
            }

            return true;
        }

        static public bool CreatePlayoffSeed(PlayoffSeed ps)
        {
            //CREATE PROCEDURE dbo.CreatePlayoffSeed(@playoffId bigint, @teamId bigint, @seedNo int)
            //AS

            //    INSERT INTO PlayoffSeeds VALUES(@playoffId, @teamId, @seedNo)
            DB db = DBConnection.GetContext();

            var dbPlayoffSeed = new SportsManager.Model.PlayoffSeed()
            {
                PlayoffId = ps.PlayoffId,
                SeedNo = ps.SeedNo,
                TeamId = ps.TeamId
            };

            db.PlayoffSeeds.InsertOnSubmit(dbPlayoffSeed);
            db.SubmitChanges();

            return true;
        }
        static public bool ModifyPlayoffSeed(PlayoffSeed ps)
        {
            //CREATE PROCEDURE dbo.UpdatePlayoffSeed( @id bigint, @playoffId bigint, @teamId bigint, @seedNo int)
            //UPDATE PlayoffSeeds 
            //SET PlayoffId = @playoffId, TeamId = @teamId, SeedNo = @seedNo 
            //WHERE Id = @id
            DB db = DBConnection.GetContext();

            var dbPlayoffSeed = (from p in db.PlayoffSeeds
                                 where ps.Id == p.Id
                                 select p).SingleOrDefault();
            if (dbPlayoffSeed == null)
                return false;

            dbPlayoffSeed.PlayoffId = ps.PlayoffId;
            dbPlayoffSeed.TeamId = ps.TeamId;
            dbPlayoffSeed.SeedNo = ps.SeedNo;

            db.SubmitChanges();

            return true;
        }

        static public IQueryable<PlayoffBracket> GetPlayoffBrackets(long playoffId)
        {
            DB db = DBConnection.GetContext();

            return (from pb in db.PlayoffBrackets
                    where pb.PlayoffId == playoffId
                    select new PlayoffBracket(pb.Id, pb.PlayoffId, pb.Team1Id, pb.Team1IdType, pb.Team2Id, pb.Team2IdType, pb.GameNo, pb.RoundNo, pb.NumGamesInSeries));
        }

        static public PlayoffBracket GetPlayoffBracket(long playoffId, int roundNo, int gameNo)
        {
            DB db = DBConnection.GetContext();

            return (from pb in db.PlayoffBrackets
                    where pb.PlayoffId == playoffId && pb.RoundNo == roundNo && pb.GameNo == gameNo
                    select new PlayoffBracket(pb.Id, pb.PlayoffId, pb.Team1Id, pb.Team1IdType, pb.Team2Id, pb.Team2IdType, pb.GameNo, pb.RoundNo, pb.NumGamesInSeries)).SingleOrDefault();
        }

        static public PlayoffBracket GetPlayoffBracket(long id)
        {
            DB db = DBConnection.GetContext();

            return (from pb in db.PlayoffBrackets
                    where pb.Id == id
                    select new PlayoffBracket(pb.Id, pb.PlayoffId, pb.Team1Id, pb.Team1IdType, pb.Team2Id, pb.Team2IdType, pb.GameNo, pb.RoundNo, pb.NumGamesInSeries)).SingleOrDefault();
        }

        static public bool RemovePlayoffBracket(PlayoffBracket p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffBracket = (from pb in db.PlayoffBrackets
                                    where pb.Id == p.Id
                                    select pb).SingleOrDefault();
            if (dbPlayoffBracket == null)
                return false;

            db.PlayoffBrackets.DeleteOnSubmit(dbPlayoffBracket);
            db.SubmitChanges();

            return true;
        }


        static public bool ModifyPlayoffBracket(PlayoffBracket p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffBracket = (from pb in db.PlayoffBrackets
                                    where pb.Id == p.Id
                                    select pb).SingleOrDefault();
            if (dbPlayoffBracket == null)
                return false;

            dbPlayoffBracket.Team1Id = p.Team1Id;
            dbPlayoffBracket.Team1IdType = p.Team1IdType;
            dbPlayoffBracket.Team2Id = p.Team2Id;
            dbPlayoffBracket.Team2IdType = p.Team2IdType;
            dbPlayoffBracket.NumGamesInSeries = p.NumGamesInSeries;

            db.SubmitChanges();

            return true;
        }

        static public bool AddPlayoffBracket(PlayoffBracket p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffBracket = new SportsManager.Model.PlayoffBracket()
            {
                Team1Id = p.Team1Id,
                Team1IdType = p.Team1IdType,
                Team2Id = p.Team2Id,
                Team2IdType = p.Team2IdType,
                NumGamesInSeries = p.NumGamesInSeries,
                GameNo = p.GameNo,
                RoundNo = p.RoundNo,
                PlayoffId = p.PlayoffId
            };

            db.PlayoffBrackets.InsertOnSubmit(dbPlayoffBracket);
            db.SubmitChanges();

            p.Id = dbPlayoffBracket.Id;
            return true;
        }


        static public IQueryable<PlayoffGame> GetPlayoffGames(long bracketId)
        {
            DB db = DBConnection.GetContext();

            return (from pg in db.PlayoffGames
                    where pg.BracketId == bracketId
                    select new PlayoffGame()
                    {
                        Id = pg.Id,
                        PlayoffId = pg.PlayoffId,
                        BracketId = pg.BracketId,
                        FieldId = pg.FieldId,
                        GameId = pg.GameId,
                        GameDate = pg.gameDate,
                        GameTime = pg.gameTime,
                        Team1HomeTeam = pg.Team1HomeTeam,
                        SeriesGameNo = pg.SeriesGameNo
                    });
        }

        static public PlayoffGame GetPlayoffGameFromGameNumber(long bracketId, int gameNo)
        {
            //SELECT * 
            //    FROM PlayoffGame 
            //    WHERE BracketId = @bracketId AND SeriesGameNo = @gameNo
            DB db = DBConnection.GetContext();

            return (from pg in db.PlayoffGames
                    where pg.BracketId == bracketId && pg.SeriesGameNo == gameNo
                    select new PlayoffGame(pg.Id, pg.BracketId, pg.FieldId, pg.gameDate, pg.gameTime, pg.GameId, pg.PlayoffId, pg.SeriesGameNo, pg.Team1HomeTeam)).SingleOrDefault();
        }

        static public PlayoffGame GetPlayoffGame(long id)
        {
            DB db = DBConnection.GetContext();

            return (from pg in db.PlayoffGames
                    where pg.Id == id
                    select new PlayoffGame(pg.Id, pg.BracketId, pg.FieldId, pg.gameDate, pg.gameTime, pg.GameId, pg.PlayoffId, pg.SeriesGameNo, pg.Team1HomeTeam)).SingleOrDefault();
        }

        static public bool RemovePlayoffGame(PlayoffGame p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffGame = (from pg in db.PlayoffGames
                                    where pg.Id == p.Id
                                    select pg).SingleOrDefault();
            if (dbPlayoffGame == null)
                return false;

            db.PlayoffGames.DeleteOnSubmit(dbPlayoffGame);
            db.SubmitChanges();
            return true;
        }


        static public bool ModifyPlayoffGame(PlayoffGame p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffGame = (from pg in db.PlayoffGames
                                 where pg.Id == p.Id
                                 select pg).SingleOrDefault();
            if (dbPlayoffGame == null)
                return false;

            dbPlayoffGame.FieldId = p.FieldId;
            dbPlayoffGame.gameDate = p.GameDate;
            dbPlayoffGame.gameTime = p.GameTime;
            dbPlayoffGame.GameId = p.GameId;
            dbPlayoffGame.Team1HomeTeam = p.Team1HomeTeam;

            db.SubmitChanges();
            return true;
        }

        static public bool AddPlayoffGame(PlayoffGame p)
        {
            DB db = DBConnection.GetContext();

            var dbPlayoffGame = new SportsManager.Model.PlayoffGame()
            {
                FieldId = p.FieldId,
                gameDate = p.GameDate,
                gameTime = p.GameTime,
                GameId = p.GameId,
                PlayoffId = p.PlayoffId,
                Team1HomeTeam = p.Team1HomeTeam,
                SeriesGameNo = p.SeriesGameNo,
                BracketId = p.BracketId
            };

            db.PlayoffGames.InsertOnSubmit(dbPlayoffGame);
            db.SubmitChanges();

            return true;
        }

        static public IEnumerable<Team> GetPlayoffTeams(ModelObjects.PlayoffBracket pg, bool onlyRealTeams)
        {
            List<Team> t = new List<Team>(2);

            var seeds = DataAccess.Playoffs.GetPlayoffSeeds(pg.PlayoffId);

            t.Add(GetPlayoffTeam(seeds, pg.PlayoffId, pg.Team1IdType, pg.Team1Id, pg.RoundNo, pg.GameNo, -1, onlyRealTeams));

            t.Add(GetPlayoffTeam(seeds, pg.PlayoffId, pg.Team2IdType, pg.Team2Id, pg.RoundNo, pg.GameNo, 0, onlyRealTeams));

            return t;
        }

        static private Team GetPlayoffTeam(IEnumerable<PlayoffSeed> seeds, long playoffId, string idType, long teamId, int roundNo, int gameNo, int modifier, bool onlyRealTeams)
        {
            Team t = null;

            if (idType == "SEED")
            {
                foreach (PlayoffSeed s in seeds)
                {
                    if (s.SeedNo == teamId)
                        t = DataAccess.Teams.GetTeam(s.TeamId);
                }

                if (t == null && !onlyRealTeams)
                {
                    t = new Team(0, 0, String.Format("Seed # {0}", teamId), 0, 0, 0);
                }

            }
            else if (idType == "GAME")
            {
                int bracketGameNo = gameNo * 2 + modifier;

                t = DataAccess.Playoffs.GetBracketWinner(playoffId, roundNo - 1, bracketGameNo);

                if (t == null && !onlyRealTeams)
                    t = new Team(0, 0, String.Format("Winner Round # {0} Bracket # {1}", roundNo - 1, bracketGameNo), 0, 0, 0);                  
            }

            return t;

        }

        static public bool SchedulePlayoffGame(long playoffGameId, long playoffId, Game game)
        {
            DB db = DBConnection.GetContext();

            //SELECT LeagueSeasonId FROM PlayoffSetup WHERE Id = @playoffId

            game.LeagueId = (from ps in db.PlayoffSetups
                             where ps.Id == playoffId
                             select ps.LeagueSeasonId).SingleOrDefault();
            if (game.LeagueId > 0)
            {
                var newGame = Schedule.AddGame(game);
                if (newGame.Id > 0)
                {
                    var dbPlayoffGame = (from pg in db.PlayoffGames
                                         where pg.PlayoffId == playoffGameId
                                         select pg).SingleOrDefault();
                    if (dbPlayoffGame != null)
                    {
                        dbPlayoffGame.GameId = newGame.Id;
                        db.SubmitChanges();
                        return true;
                    }
                }
            }

            return false;
        }

        static public TeamSeason GetBracketWinner(long playoffId, int roundNo, int gameNo)
        {
            Team team = null;

            PlayoffBracket playoffBracket = GetPlayoffBracket(playoffId, roundNo, gameNo);
            if (playoffBracket == null)
                return team;

            IEnumerable<Team> teams = DataAccess.Playoffs.GetPlayoffTeams(playoffBracket, true);

            if (playoffBracket.Team1IdType == "BYE" || playoffBracket.Team2IdType == "BYE")
            {
                if (teams.Count() > 1)
                {
                    if (playoffBracket.Team2IdType == "SEED")
                    {
                        team = teams.Last();
                    }
                    else if (playoffBracket.Team1IdType == "SEED")
                    {
                        team = teams.First();
                    }
                }
            }
            else if (teams.Count() == 2 && teams.First() != null && teams.Last() != null)
            {
                var games = GetPlayoffGames(playoffBracket.Id);

                int numRequiredWins = (playoffBracket.NumGamesInSeries / 2) + 1;
                int team1Wins = 0;
                int team2Wins = 0;

                foreach (PlayoffGame pg in games)
                {
                    Game g = DataAccess.Schedule.GetGame(pg.GameId);
                    if (g != null && g.GameWinner > 0)
                    {
                        if (g.GameWinner == teams.First().Id)
                            team1Wins++;
                        else if (g.GameWinner == teams.Last().Id)
                            team2Wins++;
                    }
                }

                if (team1Wins == numRequiredWins)
                    team = teams.First();
                else if (team2Wins == numRequiredWins)
                    team = teams.Last();
            }

            return team;
        }

        static public IEnumerable<Team> GetPossiblePlayoffTeams(long playoffId)
        {
            PlayoffSetup ps = DataAccess.Playoffs.GetPlayoffSetup(playoffId);
            if (ps != null)
                return DataAccess.Teams.GetTeams(ps.LeagueId);
            else
                return new List<Team>();
        }
    }
}

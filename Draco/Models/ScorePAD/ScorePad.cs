using System;
using System.Collections.Generic;
using ModelObjects;

namespace ScorePad
{
    static public class RosterPadExport
    {
        static public void ExportRoster(long teamSeasonId, long seasonId, System.IO.StreamWriter s)
        {
            s.WriteLine("\"Last Name\",\"First Name\",\"League\",\"Team\",\"Number\",\"Physical\",\"Bats\",\"Throws\",\"Batting Order\",\"Position\",\"Address\",\"City_State\",\"Zip\",\"Phone\",\"Notes\",\"G\",\"GS\",\"PA\",\"Atbats\",\"R\",\"H\",\"2B\",\"3B\",\"HR\",\"RBI\",\"K\",\"Kc\",\"SB\",\"SH\",\"SF\",\"HBP\",\"BB\",\"IBB\",\"CS\",\"GDP\",\"A\",\"PO\",\"DP\",\"E\",\"PB\",\"PAB\",\"PH\",\"PRBI\",\"PHR\",\"G\",\"GS\",\"CG\",\"SHO\",\"W\",\"L\",\"SV\",\"SVO\",\"FG\",\"ND\",\"IP\",\"BF\",\"AB\",\"H\",\"HR\",\"ER\",\"R\",\"BB\",\"IBB\",\"K\",\"Kc\",\"WP\",\"BK\",\"HB\",\"SBA\",\"SB\"");

            List<Player> teamPlayers = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
            List<GameBatStats> batStats = DataAccess.GameStats.GetBatTeamPlayerSeasonTotals(teamSeasonId, seasonId, String.Empty);
            List<GamePitchStats> pitchStats = DataAccess.GameStats.GetPitchTeamPlayerSeasonTotals(teamSeasonId, seasonId, String.Empty);

            Team t = DataAccess.Teams.GetTeam(teamSeasonId);
            if (t == null)
                return;

            string leagueName = DataAccess.Leagues.GetLeagueName(t.LeagueId);

            foreach (Player p in teamPlayers)
            {
                string firstName = p.FirstName + " " + p.MiddleName;
                firstName = firstName.Trim();

                s.Write("\"{0}\",\"{1}\",\"{2}\",\"{3}\",{4},\"\",\"\",\"\",\"\",\"\",\"{5}\",\"{6}\",\"{7}\",\"{8}\",\"\",0,0,",
                    new object[] { p.LastName, firstName, leagueName, t.Name, p.PlayerNumber, p.StreetAddress, p.CityState, p.Zip, p.SinglePhone });

                GameBatStats batStat = FindBatStats(p.Id, batStats);
                if (batStat != null)
                    s.Write("\"PA\",\"Atbats\",\"R\",\"H\",\"2B\",\"3B\",\"HR\",\"RBI\",\"K\",\"Kc\",\"SB\",\"SH\",\"SF\",\"HBP\",\"BB\",\"IBB\",\"CS\",\"GDP\",\"A\",\"PO\",\"DP\",\"E\",\"PB\",\"PAB\",\"PH\",\"PRBI\",\"PHR\",\"G\",\"GS\",\"CG\",\"SHO\",\"W\",\"L\",\"SV\",\"SVO\",\"FG\",\"ND\",\"IP\",\"BF\",\"AB\",\"H\",\"HR\",\"ER\",\"R\",\"BB\",\"IBB\",\"K\",\"Kc\",\"WP\",\"BK\",\"HB\",\"SBA\",\"SB\"",
                        new object[] { });
                else
                    s.Write("0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,");

                // no field statsr.
                s.Write("0,0,0,0,0,0,0,0,0,");

                GamePitchStats ps = FindPitchStats(p.Id, pitchStats);
                if (ps != null)
                    s.WriteLine("0,0,0,0,{0},{1},{2},0,0,0,{3},{4},{5},{6},{7},{8},{9},{10},0,{11},0,{12},{13},{14},0,0",
                        new object[] { ps.W, ps.L, ps.S, ps.IPDecimal, ps.BF, ps.AB, ps.H, ps.HR, ps.ER, ps.R, ps.BB, ps.SO, ps.WP, ps.BK, ps.HBP });
                else
                    s.WriteLine("0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0");

            }
        }

        static private GameBatStats FindBatStats(long playerId, List<GameBatStats> stats)
        {
            foreach (GameBatStats bs in stats)
            {
                if (bs.PlayerId == playerId)
                    return bs;
            }

            return null;
        }

        static private GamePitchStats FindPitchStats(long playerId, List<GamePitchStats> stats)
        {
            foreach (GamePitchStats ps in stats)
            {
                if (ps.PlayerId == playerId)
                    return ps;
            }

            return null;
        }

    }

    /// <summary>
    /// Summary description for ScorePad
    /// </summary>
    public class ScorePadParser
    {
        private Dictionary<string, long> m_playerNamesToIds = new Dictionary<string, long>();

        private List<GameBatStats> m_awayBatStats = new List<GameBatStats>();
        private List<GameBatStats> m_homeBatStats = new List<GameBatStats>();

        private List<GamePitchStats> m_awayPitchStats = new List<GamePitchStats>();
        private List<GamePitchStats> m_homePitchStats = new List<GamePitchStats>();

        private char[] m_seps = new char[] { ',' };

        public void ParseGameStats(System.IO.Stream s, long leagueId)
        {
            string homeTeam = string.Empty;
            string awayTeam = string.Empty;
            string gameDate = string.Empty;
            string gameTime = string.Empty;

            System.IO.StreamReader sr = new System.IO.StreamReader(s);

            try
            {
                string statLine = sr.ReadLine();

                if (!statLine.StartsWith("Team,Name,Order,Pos"))
                    return;

                // get away team
                statLine = sr.ReadLine();
                string[] tokens = statLine.Split(m_seps);

                if (tokens.Length < 1)
                    return;

                awayTeam = tokens[0];

                statLine = sr.ReadLine();
                while (statLine != null)
                {
                    if (statLine.StartsWith("Team,Name,Order,Pos"))
                    {
                        // get home team
                        statLine = sr.ReadLine();
                        tokens = statLine.Split(m_seps);

                        if (tokens.Length < 1)
                            return;

                        homeTeam = tokens[0];
                        break;
                    }
                    else
                    {
                        statLine = sr.ReadLine();
                    }
                }

                statLine = sr.ReadLine();
                while (statLine != null)
                {
                    if (statLine.CompareTo("Game") == 0)
                    {
                        statLine = sr.ReadLine();
                        if (statLine.StartsWith("Date,Time,Duration,"))
                        {
                            statLine = sr.ReadLine();
                            tokens = statLine.Split(m_seps);
                            if (tokens.Length >= 2)
                            {
                                gameDate = tokens[0];
                                gameTime = gameDate + " " + tokens[1];
                            }
                        }
                        break;
                    }
                    else
                    {
                        statLine = sr.ReadLine();
                    }
                }
            }
            catch (NullReferenceException)
            {
                return;
            }

            if (homeTeam.Length > 0 &&
                awayTeam.Length > 0 &&
                gameDate.Length > 0 &&
                gameTime.Length > 0)
            {
                Game g = FindGame(leagueId, homeTeam, awayTeam, gameDate, gameTime);

                if (g != null)
                    ParseStats(g, s);
            }
        }

        private Game FindGame(long leagueId, string homeTeamName, string awayTeamName, string gameDate, string gameTime)
        {
            Game g = null;

            List<Team> homeTeams = new List<Team>();
            List<Team> awayTeams = new List<Team>();

            List<Team> teams = DataAccess.Teams.GetTeams(leagueId, false);

            foreach (Team t in teams)
            {
                if (t.Name.StartsWith(homeTeamName, true, System.Globalization.CultureInfo.CurrentCulture))
                {
                    homeTeams.Add(t);
                }

                if (t.Name.StartsWith(awayTeamName, true, System.Globalization.CultureInfo.CurrentCulture))
                {
                    awayTeams.Add(t);
                }
            }

            if (homeTeams.Count == 1 && awayTeams.Count == 1)
            {
                List<Game> games = DataAccess.Schedule.FindGame(homeTeams[0], awayTeams[0], gameDate, gameTime);

                if (games.Count == 1)
                    g = games[0];
            }

            return g;
        }

        public void ParseStats(Game game, System.IO.Stream s)
        {
            System.IO.StreamReader sr = new System.IO.StreamReader(s);

            // first line is header, skip it:
            //  0    1     2   3   4   5  6 7 8  9 10 11 12 13  14     15    16    17 18 19  20 21  22  23   24  25   26  27   28   29    30   31  32 33 34 35 36  37 38 39 40  41   42    43  44 45  46  47     48    49   50     51 52  53  54  55 56 57 58  59    60   61   62  63  64
            //Team,Name,Order,Pos,Inn,PA,AB,R,H,TB,2B,3B,HR,FC,ERRCH,DEFINT,OBSTR,RBI,SH,SF,HBP,BB,IBB,STL2,STL3,STLH,CS2,CS3,CSH,PKOF1,PKOF2,PKOF3,K,Kc,SB,CS,GDP,ET,EF,GO,LO,FLYO,POPO,FOULO,TP,IF,KBF,OFINT,ILLBAT,BPV,SPECINT,PAB,PH,PHR,PRBI,PO,A, DP,PB,PCHR,STLON,THO,CINT,Kd3,Kd3O
            string statLine = sr.ReadLine();
            if (statLine == null)
                return;

            m_awayBatStats = ParseBatStats(game.Id, game.AwayTeamId, sr);

            // skip header
            statLine = sr.ReadLine();
            if (statLine == null)
                return;

            m_awayPitchStats = ParsePitchStats(game.Id, game.AwayTeamId, sr);

            m_homeBatStats = ParseBatStats(game.Id, game.HomeTeamId, sr);

            // skip header
            //   0   1    2 3  4  5 6  7  8  9 10 11 12 13 14 15 16  17 18 19 20 21 22 23 24  25 26 27 28  29 30 31
            // Team,Name,IP,H,AB,BF,R,ER,1B,2B,3B,HR,SH,SF,HB,BB,IBB,K, Kc,WP,BK,B, S, Sc,F, POA,NP,I, FPS,BP,EP,AP
            statLine = sr.ReadLine();
            if (statLine == null)
                return;

            m_homePitchStats = ParsePitchStats(game.Id, game.HomeTeamId, sr);

            // skip header
            //   0   1       2         3            4          5
            // Date,Time,Duration,Win Pitcher,Lose Pitcher,Save Pitcher
            statLine = sr.ReadLine();
            if (statLine == null)
                return;

            bool homeTeamWinner = game.GameWinner == game.HomeTeamId ? true : false;
            ParsePitcherDecision(homeTeamWinner, m_awayPitchStats, m_homePitchStats, sr);
        }

        private List<GameBatStats> ParseBatStats(long gameId, long teamId, System.IO.StreamReader sr)
        {
            List<GameBatStats> batStats = new List<GameBatStats>();

            string statLine = sr.ReadLine();

            while (statLine != null)
            {
                string[] tokens = statLine.Split(m_seps);
                if (tokens != null && tokens.Length > 0)
                {
                    if (String.Compare(tokens[0], "pitchers", true) == 0)
                    {
                        break;
                    }

                    GameBatStats stats = new GameBatStats();

                    stats.GameId = gameId;
                    stats.TeamId = teamId;

                    stats.PlayerId = GetPlayerFromName(stats.TeamId, tokens[1]);
                    if (stats.PlayerId != 0)
                    {
                        stats.AB = Int32.Parse(tokens[6]);
                        stats.BB = Int32.Parse(tokens[21]);
                        stats.CS = Int32.Parse(tokens[35]);
                        stats.D = Int32.Parse(tokens[10]);
                        stats.H = Int32.Parse(tokens[8]);
                        stats.HBP = Int32.Parse(tokens[20]);
                        stats.HR = Int32.Parse(tokens[12]);
                        stats.INTR = Int32.Parse(tokens[15]);
                        stats.LOB = 0; // don't have
                        stats.R = Int32.Parse(tokens[7]);
                        stats.RE = Int32.Parse(tokens[14]);
                        stats.SB = Int32.Parse(tokens[34]);
                        stats.SF = Int32.Parse(tokens[19]);
                        stats.SH = Int32.Parse(tokens[18]);
                        stats.SO = Int32.Parse(tokens[32]);
                        stats.T = Int32.Parse(tokens[11]);

                        batStats.Add(stats);
                    }
                }

                statLine = sr.ReadLine();
            }

            return batStats;
        }

        private List<GamePitchStats> ParsePitchStats(long gameId, long teamId, System.IO.StreamReader sr)
        {
            List<GamePitchStats> pitchStats = new List<GamePitchStats>();

            string statLine = sr.ReadLine();

            while (statLine != null)
            {
                if (statLine.StartsWith("Team,Name,Order,Pos") || String.Compare(statLine, "Game") == 0 )
                {
                    break;
                }

                string[] tokens = statLine.Split(m_seps);
                if (tokens != null && tokens.Length > 0)
                {
                    GamePitchStats stats = new GamePitchStats();

                    stats.GameId = gameId;
                    stats.TeamId = teamId;

                    stats.PlayerId = GetPlayerFromName(stats.TeamId, tokens[1]);
                    if (stats.PlayerId != 0)
                    {
                        stats.BB = Int32.Parse(tokens[15]);
                        stats.BF = Int32.Parse(tokens[5]);
                        stats.BK = Int32.Parse(tokens[20]);
                        stats.D = Int32.Parse(tokens[9]);
                        stats.ER = Int32.Parse(tokens[7]);
                        stats.H = Int32.Parse(tokens[3]);
                        stats.HBP = Int32.Parse(tokens[14]);
                        stats.HR = Int32.Parse(tokens[11]);
                        ParseIP(tokens[2], stats);
                        stats.R = Int32.Parse(tokens[6]);
                        stats.SC = Int32.Parse(tokens[12]) + Int32.Parse(tokens[13]);
                        stats.SO = Int32.Parse(tokens[17]);
                        stats.T = Int32.Parse(tokens[10]);
                        stats.WP = Int32.Parse(tokens[19]);

                        pitchStats.Add(stats);
                    }
                }

                statLine = sr.ReadLine();
            }

            return pitchStats;
        }

        private void ParseIP(string ipString, GamePitchStats stats)
        {
            string[] ipParts = ipString.Split(new char[] { '.' });
            if (ipParts != null && ipParts.Length > 0)
            {
                stats.IP = Int32.Parse(ipParts[0]);
                if (ipParts.Length > 1)
                    stats.IP2 = Int32.Parse(ipParts[1]);
            }
        }

        private void ParsePitcherDecision(bool homeTeamWinner, List<GamePitchStats> awayPitchStats, List<GamePitchStats> homePitchStats, System.IO.StreamReader sr)
        {
            string statLine = sr.ReadLine();
            if (statLine == null)
                return;

            string[] tokens = statLine.Split(m_seps);
            if (tokens != null && tokens.Length >= 6)
            {
                string winPitcher = tokens[3];
                string losePitcher = tokens[4];
                string savePitcher = tokens[5];

                List<GamePitchStats> winPitchStats = (homeTeamWinner ? homePitchStats : awayPitchStats);
                List<GamePitchStats> losePitchStats = (!homeTeamWinner ? awayPitchStats : homePitchStats);

                GamePitchStats pitcher = GetPlayerStatsFromName(winPitcher, winPitchStats);
                if (pitcher != null)
                    pitcher.W = 1;

                pitcher = GetPlayerStatsFromName(losePitcher, losePitchStats);
                if (pitcher != null)
                    pitcher.L = 1;

                pitcher = GetPlayerStatsFromName(savePitcher, winPitchStats);
                if (pitcher != null)
                    pitcher.S = 1;
            }
        }

        private GamePitchStats GetPlayerStatsFromName(string name, List<GamePitchStats> pitchStats)
        {
            if (m_playerNamesToIds.ContainsKey(name))
            {
                long playerId = m_playerNamesToIds[name];
                foreach (GamePitchStats stat in pitchStats)
                {
                    if (stat.PlayerId == playerId)
                        return stat;
                }
            }

            return null;
        }

        private long GetPlayerFromName(long teamId, string name)
        {
            long playerId = 0;

            if (m_playerNamesToIds.ContainsKey(name))
            {
                playerId = m_playerNamesToIds[name];
            }
            else
            {
                playerId = DataAccess.TeamRoster.GetTeamPlayerIdFromName(teamId, name);
                m_playerNamesToIds[name] = playerId;
            }

            return playerId;
        }
    }
}
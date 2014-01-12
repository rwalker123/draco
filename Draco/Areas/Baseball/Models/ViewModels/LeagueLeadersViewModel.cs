using System;
using System.Collections.Generic;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueLeadersViewModel
    {
        private int m_allTimeMinAB = 150;
        private int m_minABPerSeason = 30;
        private int m_allTimeMinIP = 100;
        private int m_minIPPerSeason = 20;

        private List<LeaderLine> m_leaderLines = new List<LeaderLine>();
        private TitleLeaderLine m_titleLeader;
        private List<LeagueLeaderStat> m_leaders;

        public class LeaderLine
        {
            public String LeaderNum;
            public String Name;
            public long PlayerId;
            public String Team;
            public String Value;
            public bool IsTie;
        }

        public class TitleLeaderLine : LeaderLine
        {
            public String PhotoURL;
        }

        public LeagueLeadersViewModel(long accountId, long leagueId, long divisionId, string category, bool isBatStats, bool allTimeLeaders, bool calculateMin,
            string fieldFormat = "#.000",
            string tieImage = "tie1.gif",
            string cssHeaderStyle = "statHeader1")
        {
            AccountId = accountId;
            LeagueId = leagueId;
            DivisionId = divisionId;
            IsAllTimeLeaders = allTimeLeaders;
            CalculateMinAB = calculateMin;
            Category = category;
            FieldFormat = fieldFormat;
            TieImage = tieImage;
            StatCssHeaderStyle = cssHeaderStyle;
            IsBatStats = isBatStats;

            if (LeagueId != 0)
            {
                if (IsBatStats)
                    m_leaders = DataAccess.GameStats.GetBatLeagueLeaders(LeagueId, DivisionId, Category, 5, Min, IsAllTimeLeaders);
                else
                    m_leaders = DataAccess.GameStats.GetPitchLeagueLeaders(LeagueId, DivisionId, Category, 5, Min, IsAllTimeLeaders);

                Title = DataAccess.Leagues.GetLeagueName(LeagueId) + " " + Category + " Leaders";

                ProcessLeaders(m_leaders);
            }
            else
            {
                Title = "League Leaders";
            }
        }

        public long AccountId { get; private set; }
        public long LeagueId { get; private set; }
        public long DivisionId { get; private set; }
        public bool IsAllTimeLeaders { get; private set; }
        public bool CalculateMinAB { get; private set; }
        public string Category { get; private set; }
        public string Title { get; private set; }
        public string FieldFormat { get; private set; }
        public bool IsBatStats { get; private set; }
        public string TieImage { get; private set; }
        public string StatCssHeaderStyle { get; private set; }

        public ICollection<LeagueLeaderStat> Leaders { get { return m_leaders; } }
        public ICollection<LeaderLine> LeaderLines { get { return m_leaderLines; } }
        public TitleLeaderLine TitleLeader { get { return m_titleLeader; } }

        public int Min
        {
            get
            {
                if (CalculateMinAB)
                {
                    if (IsAllTimeLeaders)
                    {
                        if (IsBatStats)
                        {
                            int numSeasons = DataAccess.Seasons.GetSeasons(AccountId).Count;
                            int minAB = numSeasons * m_minABPerSeason;
                            return (minAB > m_allTimeMinAB) ? m_allTimeMinAB : minAB;
                        }
                        else
                        {
                            int numSeasons = DataAccess.Seasons.GetSeasons(AccountId).Count;
                            int minIP = numSeasons * m_minIPPerSeason;
                            return (minIP > m_allTimeMinIP) ? m_allTimeMinIP : minIP;
                        }
                    }
                    if (IsBatStats)
                        return DataAccess.GameStats.CalculateMinAB(LeagueId);
                    else
                        return DataAccess.GameStats.CalculateMinIP(LeagueId);
                }
                else
                {
                    return -1;
                }
            }
        }

        private void ProcessLeaders(List<LeagueLeaderStat> leaders)
        {
            int i = 0;
            int leaderTie = 0;

            String playerName;
            String playerTeam;
            String playerPhoto;

            foreach (LeagueLeaderStat lls in m_leaders)
            {
                ++i;

                playerName = String.Empty;
                playerTeam = String.Empty;
                playerPhoto = String.Empty;

                ModelObjects.Player leaderPlayer = null;
                bool isTie = false;

                if (lls.FieldName == "TIE")
                {
                    playerName = lls.TieCount + " tied with ";
                    isTie = true;
                }
                else
                {
                    if (IsAllTimeLeaders)
                        leaderPlayer = DataAccess.TeamRoster.GetPlayerFromId(lls.PlayerId);
                    else
                        leaderPlayer = DataAccess.TeamRoster.GetPlayer(lls.PlayerId);

                    if (leaderPlayer != null)
                    {
                        playerName = leaderPlayer.Contact.LastName;
                        playerTeam = DataAccess.Teams.GetTeamName(leaderPlayer.TeamId);
                    }
                }

                if (i == 1)
                {
                    if (lls.FieldName == "TIE")
                    {
                        playerPhoto = "~/Images/" + TieImage;
                    }
                    else
                    {
						playerPhoto = leaderPlayer != null ? leaderPlayer.Contact.PhotoURL : String.Empty;

                        if (IsBatStats)
                        {
                            playerPhoto = (playerPhoto == null || playerPhoto.Length == 0) ? "~/Images/batter.gif" : playerPhoto;
                        }
                        else
                        {
                            playerPhoto = (playerPhoto == null || playerPhoto.Length == 0) ? "~/Images/pitcher.gif" : playerPhoto;
                        }
                    }

                    m_titleLeader = new TitleLeaderLine();

                    m_titleLeader.PlayerId = (leaderPlayer == null) ? 0 : leaderPlayer.Id;
                    m_titleLeader.LeaderNum = "1";
                    m_titleLeader.Name = playerName;
                    m_titleLeader.Team = playerTeam;
                    m_titleLeader.Value = lls.FieldTotal.ToString(FieldFormat);
                    m_titleLeader.PhotoURL = playerPhoto;
                    m_titleLeader.IsTie = isTie;
                }
                else
                {
                    LeaderLine ll = new LeaderLine();

                    ll.Name = playerName;
                    ll.Team = playerTeam;
                    ll.Value = lls.FieldTotal.ToString(FieldFormat);
                    ll.IsTie = isTie;
                    ll.PlayerId = (leaderPlayer == null) ? 0 : leaderPlayer.Id;

                    if (leaderPlayer != null)
                        ll.LeaderNum = (i <= leaderTie) ? "1" : i.ToString();
                    else
                        ll.LeaderNum = i.ToString();

                    m_leaderLines.Add(ll);

                }
            }
        }
    }
}
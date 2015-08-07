using System;
using System.Collections.Generic;
using ModelObjects;
using SportsManager.ViewModels.API;
using SportsManager.Utils;
using System.Web.Mvc;
using System.Linq;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueLeadersViewModel
    {
        private int m_allTimeMinAB = 150;
        private int m_minABPerSeason = 30;
        private int m_allTimeMinIP = 100;
        private int m_minIPPerSeason = 20;

        private List<LeaderLine> m_leaderLines = new List<LeaderLine>();
        private List<LeagueLeaderStatViewModel> m_leaders;

        public class LeaderLine
        {
            public String LeaderNum;
            public String FirstName;
            public String LastName;
            public long PlayerId;
            public String Team;
            public String Value;
            public bool IsTie;
            public String PhotoURL;
        }

        private DB m_db;

        public LeagueLeadersViewModel(long accountId, long leagueId, long divisionId, string category, bool isBatStats, bool allTimeLeaders, bool calculateMin,
            string fieldFormat = "#.000",
            string tieImage = "tie1.gif",
            string cssHeaderStyle = "statHeader1")
        {
            m_db = DependencyResolver.Current.GetService<DB>();

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
                {
                    var statsHelper = new BatStatsHelper(m_db);
                    m_leaders = statsHelper.GetBatLeagueLeaders(LeagueId, DivisionId, Category, 5, Min, IsAllTimeLeaders);
                }
                else
                {
                    var statsHelper = new PitchStatsHelper(m_db);
                    m_leaders = statsHelper.GetPitchLeagueLeaders(LeagueId, DivisionId, Category, 5, Min, IsAllTimeLeaders);
                }

                var leagueName = m_db.LeagueSeasons.Find(LeagueId)?.League.Name;

                Title = leagueName + " " + Category + " Leaders";

                ProcessLeaders();
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

        public ICollection<LeagueLeaderStatViewModel> Leaders { get { return m_leaders; } }
        public ICollection<LeaderLine> LeaderLines { get { return m_leaderLines; } }

        public int Min
        {
            get
            {
                if (CalculateMinAB)
                {
                    if (IsAllTimeLeaders)
                    {
                        int numSeasons = m_db.Seasons.Where(s => s.AccountId == AccountId).Count();

                        if (IsBatStats)
                        {
                            int minAB = numSeasons * m_minABPerSeason;
                            return (minAB > m_allTimeMinAB) ? m_allTimeMinAB : minAB;
                        }
                        else
                        {
                            int minIP = numSeasons * m_minIPPerSeason;
                            return (minIP > m_allTimeMinIP) ? m_allTimeMinIP : minIP;
                        }
                    }

                    var minCalculator = new MinCalculator(m_db);
                    if (IsBatStats)
                        return minCalculator.CalculateMinAB(LeagueId);
                    else
                        return minCalculator.CalculateMinIP(LeagueId);
                }
                else
                {
                    return -1;
                }
            }
        }

        private void ProcessLeaders()
        {
            bool firstTime = true;

            foreach (var lls in m_leaders)
            {
                if (firstTime)
                {
                    firstTime = false;
                    if (lls.FieldName == "TIE")
                        continue;
                }

                LeaderLine ll = new LeaderLine();

                Player leaderPlayer = null;
                bool isTie = false;

                if (lls.FieldName == "TIE")
                {
                    ll.FirstName = lls.TieCount + " tied with ";
                    isTie = true;
                }
                else
                {
                    var teamName = String.Empty;

                    if (IsAllTimeLeaders)
                        leaderPlayer = m_db.Rosters.Find(lls.PlayerId);
                    else
                    {
                        var rosterSeasonPlayer = m_db.RosterSeasons.Find(lls.PlayerId);
                        leaderPlayer = rosterSeasonPlayer?.Roster;
                        teamName = rosterSeasonPlayer?.TeamSeason.Name;
                    }

                    if (leaderPlayer != null)
                    {
                        ll.PlayerId = leaderPlayer.Id;
                        ll.LastName = leaderPlayer.Contact.LastName;
                        ll.FirstName = leaderPlayer.Contact.FirstName;
                        ll.Team = teamName;
                        ll.PhotoURL = leaderPlayer.Contact.PhotoURL;
                    }
                }

                ll.Value = lls.FieldTotal.ToString(FieldFormat);
                ll.IsTie = isTie;

                m_leaderLines.Add(ll);
            }
        }
    }
}
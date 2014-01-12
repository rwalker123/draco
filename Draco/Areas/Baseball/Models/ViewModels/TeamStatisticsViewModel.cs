using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using ModelObjects;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamStatisticsViewModel
    {
        public TeamStatisticsViewModel(long accountId, long teamId)
        {
            AccountId = accountId;
            TeamId = teamId;
            SeasonId = 0;
        }

        public TeamStatisticsViewModel(long accountId, long teamSeasonId, long seasonId)
        {
            AccountId = accountId;
        }

        public long AccountId { get; private set; }
        public long TeamId { get; private set; }
        public long SeasonId { get; private set; }

        private class TeamSeason
        {
            private List<string> m_seasonList = new List<string>();

            public TeamSeason(string teamName, string seasonName)
            {
                TeamName = teamName;
                m_seasonList.Add(seasonName);
            }

            public string TeamName { get; private set; }
            public void AddSeason(string seasonName)
            {
                m_seasonList.Add(seasonName);
            }

            public override string ToString()
            {
                StringBuilder sb = new StringBuilder();

                sb.Append(TeamName);
                sb.Append(" (");

                int prevSeason = -1;
                bool firstTime = true;
                bool inSeries = false;
                string lastSeason = String.Empty;

                foreach (string s in m_seasonList)
                {
                    int curSeason;
                    if (int.TryParse(s, out curSeason))
                    {
                        if (prevSeason == curSeason - 1)
                        {
                            if (!inSeries)
                            {
                                sb.Append(" - ");
                                inSeries = true;
                            }
                        }
                        else
                        {
                            if (inSeries)
                            {
                                sb.Append(lastSeason);
                                sb.Append(", ");

                                sb.Append(s);
                                inSeries = false;
                            }
                            else
                            {
                                if (!firstTime)
                                    sb.Append(", ");

                                sb.Append(s);
                            }
                        }

                        prevSeason = curSeason;
                    }
                    else
                    {
                        if (!firstTime)
                            sb.Append(", ");

                        sb.Append(s);
                    }

                    firstTime = false;
                    lastSeason = s;
                }

                if (inSeries)
                {
                    sb.Append(lastSeason);
                }

                sb.Append(")");

                return sb.ToString();
            }
        }
        public IEnumerable<SelectListItem> GetHistoricalTeams()
        {
            // league Name Team Name (seasons)
            // 25+ Reds (2001-2004)

            Dictionary<long, TeamSeason> m_teamIdToName = new Dictionary<long, TeamSeason>();

            ICollection<Season> seasons = DataAccess.Seasons.GetSeasons(AccountId);
            foreach (Season s in seasons)
            {
                IEnumerable<League> leagues = DataAccess.Leagues.GetLeagues(s.Id);
                foreach (League l in leagues)
                {
                    IEnumerable<Team> teams = DataAccess.Teams.GetTeams(l.Id);
                    foreach (Team t in teams)
                    {
                        if (m_teamIdToName.ContainsKey(t.TeamId))
                            m_teamIdToName[t.TeamId].AddSeason(s.Name);
                        else
                            m_teamIdToName[t.TeamId] = new TeamSeason(l.Name + " " + t.Name, s.Name);
                    }
                }
            }

            return (from teamToName in m_teamIdToName
                    orderby teamToName.Value.TeamName
                    select new SelectListItem() { Text = teamToName.Value.ToString(), Value = teamToName.Key.ToString() });
        }
    }
}
using AutoMapper;
using ModelObjects;
using SportsManager.Baseball.ViewModels.API;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Baseball.Utils
{
    public class LeaderStatRecord
    {
        public LeaderStatRecord()
        {
            PlayerId = 0;
            TeamId = 0;
            FieldTotal = Decimal.MinValue;
            CheckField = Decimal.MinValue;
        }
        public long PlayerId { get; set; }
        public long TeamId { get; set; }
        public Decimal? FieldTotal { get; set; }
        public Decimal? CheckField { get; set; }
    };

    public abstract class StatsHelper
    {
        protected DB m_db;
        public StatsHelper(DB db)
        {
            m_db = db;
        }

        protected List<LeagueLeaderStatViewModel> ProcessLeaders(IQueryable<LeaderStatRecord> batStats, string fieldName, bool allTimeLeaders, int limitRecords, bool checkMin, int minVal)
        {
            var stats = new List<LeagueLeaderStatViewModel>();

            var leaderList = new Dictionary<double, List<LeagueLeaderStatViewModel>>();
            List<double> leaderKeys = new List<double>();

            int numRecords = 0;

            var newbs = batStats.Where(bs => bs.FieldTotal.HasValue && (!checkMin || (checkMin && ((int)bs.CheckField) >= minVal)));

            foreach (var batStat in newbs)
            {
                double totalValue = (double)batStat.FieldTotal;
                LeagueLeaderStatViewModel stat = new LeagueLeaderStatViewModel(fieldName, batStat.PlayerId, allTimeLeaders ? 0 : batStat.TeamId, totalValue);
                if (leaderList.ContainsKey(totalValue))
                {
                    leaderList[totalValue].Add(stat);
                }
                else
                {
                    // if we need to add a new record, it means we are done with potential ties.
                    if (numRecords >= limitRecords)
                        break;

                    leaderKeys.Add(totalValue);

                    var leaderStats = new List<LeagueLeaderStatViewModel>();
                    leaderStats.Add(stat);
                    leaderList[totalValue] = leaderStats;
                }

                ++numRecords;
            }

            foreach (double leaderKey in leaderKeys)
            {
                var leaderStats = leaderList[leaderKey];
                bool addedLeaderTie = false;

                // a tie for overall leader.
                //if (stats.Count == 0 && leaderStats.Count > 1)
                //{
                //    // add tie indicator for overall leader
                //    stats.Add(new LeagueLeaderStat(leaderStats.Count, leaderKey));
                //    addedLeaderTie = true;
                //}

                // if we can display all the leaders, display them, otherwise done.
                if (leaderStats.Count + stats.Count <= limitRecords)
                {
                    foreach (var leaderStat in leaderStats)
                    {
                        stats.Add(leaderStat);
                    }
                }
                else
                {
                    if (!addedLeaderTie)
                        stats.Add(new LeagueLeaderStatViewModel(leaderStats.Count, leaderKey));

                    // done processing.
                    break;
                }

                if (stats.Count >= limitRecords)
                    break;
            }

            // add in name for player, team, and player photo.
            foreach (var stat in stats)
            {
                if (stat.PlayerId > 0)
                {
                    Contact c;
                    if (allTimeLeaders)
                    {
                        c = m_db.Rosters.Find(stat.PlayerId)?.Contact;
                    }
                    else
                    {
                        c = m_db.RosterSeasons.Find(stat.PlayerId)?.Roster.Contact;
                    }

                    stat.PlayerName = Mapper.Map<Contact, ContactNameViewModel>(c);
                }

                if (stat.TeamId > 0)
                    stat.TeamName = m_db.TeamsSeasons.Find(stat.TeamId)?.Name;

            }

            return stats;
        }
    }
}
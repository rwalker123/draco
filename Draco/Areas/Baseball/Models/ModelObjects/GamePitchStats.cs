using System;
using System.Collections.Generic;
using System.Reflection;

namespace ModelObjects
{
    public class GamePitchStatsComparer : IComparer<GamePitchStats>
    {
        private string m_sortField = string.Empty;
        private bool m_ascending = true;

        public GamePitchStatsComparer(string sortField)
        {
            string[] fields = sortField.Split(new char[] { ' ' });
            m_sortField = fields[0];
            if (fields.Length > 1)
            {
                if (fields[1] == "DESC")
                    m_ascending = false;
            }
        }

        #region IComparer<GameBatStats> Members

        public int Compare(GamePitchStats obj1, GamePitchStats obj2)
        {
            int rc = 0;

            object xVal = obj1.GetType().InvokeMember(m_sortField,
                                                        BindingFlags.DeclaredOnly |
                                                        BindingFlags.Public |
                                                        BindingFlags.NonPublic |
                                                        BindingFlags.Instance |
                                                        BindingFlags.GetProperty,
                                                        null, obj1, null);

            object yVal = obj2.GetType().InvokeMember(m_sortField,
                                                        BindingFlags.DeclaredOnly |
                                                        BindingFlags.Public |
                                                        BindingFlags.NonPublic |
                                                        BindingFlags.Instance |
                                                        BindingFlags.GetProperty,
                                                        null, obj2, null);

            string dataType = xVal.GetType().ToString();

            if (dataType == "System.Int32")
            {
                Int32 xIntVal = (Int32)xVal;
                Int32 yIntVal = (Int32)yVal;
                if (m_ascending)
                {
                    rc = yIntVal.CompareTo(xIntVal);
                }
                else
                {
                    rc = xIntVal.CompareTo(yIntVal);
                }
            }
            else if (dataType == "System.Double")
            {
                Double xDblVal = (Double)xVal;
                Double yDblVal = (Double)yVal;
                if (m_ascending)
                {
                    rc = yDblVal.CompareTo(xDblVal);
                }
                else
                {
                    rc = xDblVal.CompareTo(yDblVal);
                }
            }
            else if (dataType == "System.String")
            {
                String xStrVal = (String)xVal;
                String yStrVal = (String)yVal;
                if (m_ascending)
                {
                    rc = yStrVal.CompareTo(xStrVal);
                }
                else
                {
                    rc = xStrVal.CompareTo(yStrVal);
                }
            }


            return rc;
        }

        #endregion
    }


    /// <summary>
    /// Summary description for GamePitchStats
    /// </summary>
    public class GamePitchStats
    {
        public long Id { get; set; }
        public long PlayerId { get; set; }
        public long GameId { get; set; }
        public long TeamId { get; set; }
        public int IP { get; set; }
        public int IP2 { get; set; }
        public int BF { get; set; }
        public int W { get; set; }
        public int L { get; set; }
        public int S { get; set; }
        public int H { get; set; }
        public int R { get; set; }
        public int ER { get; set; }
        public int D { get; set; }
        public int T { get; set; }
        public int HR { get; set; }
        public int SO { get; set; }
        public int BB { get; set; }
        public int WP { get; set; }
        public int HBP { get; set; }
        public int BK { get; set; }
        public int SC { get; set; }

        public GamePitchStats()
        {
        }

        public GamePitchStats(long statsId, long playerId, long gameId, long teamId, int ip, int ip2, int bf,
                              int w, int l, int s, int h, int r, int er, int d, int t, int hr,
                              int so, int bb, int wp, int hbp, int bk, int sc)
        {
            Id = statsId;
            PlayerId = playerId;
            GameId = gameId;
            TeamId = teamId;
            IP = ip;
            IP2 = ip2;
            BF = bf;
            W = w;
            L = l;
            S = s;
            H = h;
            R = r;
            ER = er;
            D = d;
            T = t;
            HR = hr;
            SO = so;
            BB = bb;
            WP = wp;
            HBP = hbp;
            BK = bk;
            SC = sc;
        }

        public int TB
        {
            get
            {
                return (D * 2) + (T * 3) + (HR * 4) + (H - D - T - HR);
            }

            set
            {
                // to may linq happy.
            }
        }

        public int AB
        {
            get
            {
                return BF - BB - HBP - SC;
            }

            set
            {
                // to may linq happy.
            }
        }

        public double OBA
        {
            get
            {
                return AB > 0 ? (double)H / (double)AB : 0.00;
            }

            set
            {
                // to may linq happy.
            }
        }

        public double SLG
        {
            get
            {
                return AB > 0 ? (double)TB / (double)AB : 0.00;
            }

            set
            {
                // to may linq happy.
            }
        }

        // for display, not used in calculating ERA
        public double IPDecimal
        {
            get
            {
                return (double)IP + (IP2 / 3) + (IP2 % 3) / 10.0;
            }

            set
            {
                // to may linq happy.
            }
        }

        private double IPCalc
        {
            get
            {
                return (double)IP + (IP2 / 3) + (IP2 % 3) / 3.0;
            }
        }
        public double ERA
        {
            get
            {
                if (IPCalc > 0.0)
                {
                    return (double)ER * 9.0 / IPCalc;
                }
                else
                {
                    return 0.0;
                }
            }

            set
            {
                // to may linq happy.
            }
        }

        public double WHIP
        {
            get
            {
                if (IPCalc > 0.0)
                {
                    return ((double)H + (double)BB) / IPCalc;
                }
                else
                {
                    return 0.0;
                }
            }

            set
            {
                // to may linq happy.
            }
        }

        public double K9
        {
            get
            {
                if (IPCalc > 0.0)
                {
                    return (double)SO / IPCalc * 9.0;
                }
                else
                {
                    return 0.0;
                }
            }

            set
            {
                // to may linq happy.
            }
        }

        public double BB9
        {
            get
            {
                if (IPCalc > 0.0)
                {
                    return (double)BB / IPCalc * 9.0;
                }
                else
                {
                    return 0.0;
                }
            }

            set
            {
                // to may linq happy.
            }
        }

        protected virtual ContactName PlayerNameQuery()
        {
            return DataAccess.TeamRoster.GetPlayerName(PlayerId);
        }

        public string PlayerName
        {
            get
            {
                ContactName playerName = PlayerNameQuery();
                if (playerName != null)
                    return String.Format("{0}, {1} {2}", playerName.LastName, playerName.FirstName, playerName.MiddleName);

                return String.Empty;
                //    PlayerName = g.First().RosterSeason.Roster.Contact.LastName + ", " + g.First().RosterSeason.Roster.Contact.FirstName,
            }
        }

        public bool IsValid()
        {
            bool isValid = true;

            if (H + BB + HBP + SO > BF)
                isValid = false;
            else if (ER > R)
                isValid = false;
            else if (H < D + T + HR)
                isValid = false;

            return isValid;
        }

    }
}

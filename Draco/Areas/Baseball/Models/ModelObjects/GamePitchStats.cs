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
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int Ip { get; set; } // IP
        public int Ip2 { get; set; } // IP2
        public int Bf { get; set; } // BF
        public int W { get; set; } // W
        public int L { get; set; } // L
        public int S { get; set; } // S
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int Er { get; set; } // ER
        public int C2B { get; set; } // 2B
        public int C3B { get; set; } // 3B
        public int Hr { get; set; } // HR
        public int So { get; set; } // SO
        public int Bb { get; set; } // BB
        public int Wp { get; set; } // WP
        public int Hbp { get; set; } // HBP
        public int Bk { get; set; } // BK
        public int Sc { get; set; } // SC
        public int? Tb { get; set; } // TB
        public int? Ab { get; set; } // AB
        public int? WhipNumerator { get; set; } // WHIPNumerator
        public int? IpNumerator { get; set; } // IPNumerator

        // Foreign keys
        public virtual Game LeagueSchedule { get; set; } // FK_pitchstatsum_LeagueSchedule
        public virtual PlayerSeason RosterSeason { get; set; } // FK_pitchstatsum_RosterSeason
        public virtual TeamSeason TeamsSeason { get; set; } // FK_pitchstatsum_TeamsSeason

        public double IPDecimal
        {
            get
            {
                return (double)Ip + (Ip2 / 3) + (Ip2 % 3) / 10.0;
            }

            set
            {
                // to may linq happy.
            }
        }

        public double ERA
        {
            get
            {
                if (IPDecimal > 0.0)
                {
                    return (double)Er * 9.0 / IPDecimal;
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
                if (IPDecimal > 0.0)
                {
                    return ((double)H + (double)Bb) / IPDecimal;
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
                if (IPDecimal > 0.0)
                {
                    return (double)So / IPDecimal * 9.0;
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
                if (IPDecimal > 0.0)
                {
                    return (double)Bb / IPDecimal * 9.0;
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

            if (H + Bb + Hbp + So > Bf)
                isValid = false;
            else if (Er > R)
                isValid = false;
            else if (H < C2B + C3B + Hr)
                isValid = false;

            return isValid;
        }

    }
}

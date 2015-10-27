using System;
using System.Collections.Generic;
using System.Reflection;

namespace SportsManager.ViewModels.API
{
    public class PitchStatsViewModelComparer : IComparer<PitchStatsViewModel>
    {
        private string m_sortField = string.Empty;
        private bool m_ascending = true;

        public PitchStatsViewModelComparer(string sortField)
        {
            string[] fields = sortField.Split(new char[] { ' ' });
            m_sortField = fields[0];
            if (fields.Length > 1)
            {
                if (fields[1] == "DESC")
                    m_ascending = false;
            }
        }

        #region IComparer<PitchStatsViewModel> Members

        public int Compare(PitchStatsViewModel obj1, PitchStatsViewModel obj2)
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

    public class PitchStatsViewModel
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int IP { get; set; } // IP
        public int IP2 { get; set; } // IP2
        public int BF { get; set; } // BF
        public int W { get; set; } // W
        public int L { get; set; } // L
        public int S { get; set; } // S
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int ER { get; set; } // ER
        public int D { get; set; } // 2B
        public int T { get; set; } // 3B
        public int HR { get; set; } // HR
        public int SO { get; set; } // SO
        public int BB { get; set; } // BB
        public int WP { get; set; } // WP
        public int HBP { get; set; } // HBP
        public int BK { get; set; } // BK
        public int SC { get; set; } // SC
        public int TB
        {
            get
            {
                return (D * 2) + (T * 3) + (HR * 4) + (H - D - T - HR);
            }
        } // TB
        public int AB
        {
            get
            {
                return BF - BB - HBP - SC;
            }
        } 

        public double IPDecimal
        {
            get
            {
                return (double)IP + (IP2 / 3) + (IP2 % 3) / 10.0;
            }
        }

        public double IPCalc
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
        }

        public double SLG
        {
            get
            {
                if (AB > 0)
                {
                    return (double)TB / (double)AB;
                }
                else
                {
                    return 0.0;
                }
            }
        }

        public double OBA
        {
            get
            {
                if (AB > 0)
                {
                    return (double)H / (double)AB;
                }
                else
                {
                    return 0.0;
                }
            }
        }

        public string PlayerName { get; set; }

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
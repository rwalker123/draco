using System;
using System.Collections.Generic;
using System.Reflection;

namespace SportsManager.Baseball.ViewModels.API
{
    public class BatStatsViewModelComparer : IComparer<BatStatsViewModel>
    {
        private string m_sortField = string.Empty;
        private bool m_ascending = true;

        public BatStatsViewModelComparer(string sortField)
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

        public int Compare(BatStatsViewModel obj1, BatStatsViewModel obj2)
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


    public class BatStatsViewModel
    {
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int AB { get; set; } // AB
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int D { get; set; } // 2B
        public int T { get; set; } // 3B
        public int HR { get; set; } // HR
        public int RBI { get; set; } // RBI
        public int SO { get; set; } // SO
        public int BB { get; set; } // BB
        public int RE { get; set; } // RE
        public int HBP { get; set; } // HBP
        public int INTR { get; set; } // INTR
        public int SF { get; set; } // SF
        public int SH { get; set; } // SH
        public int SB { get; set; } // SB
        public int CS { get; set; } // CS
        public int LOB { get; set; } // LOB
        public int TB
        {
            get
            {
                return (D * 2) + (T * 3) + (HR * 4) + (H - D - T - HR);
            }
        }
        public int PA
        {
            get
            {
                return AB + BB + HBP + SH + SF + INTR;
            }
        } // PA
        public double AVG
        {
            get
            {
                return AB > 0 ? (double)H / (double)AB : 0.00;
            }
        } // AVG

        public double SLG
        {
            get
            {
                return AB > 0 ? (double)TB / (double)AB : 0.000;
            }
        }

        public double OBA
        {
            get
            {
                return (AB + BB + HBP) > 0 ? (double)(H + BB + HBP) / (double)(AB + BB + HBP) : 0.00;
            }
        }

        public double OPS
        {
            get
            {
                return SLG + OBA;
            }
        }

        public String PlayerName { get; set; }

        public bool IsValid()
        {
            bool isValid = true;

            if (AB < (H + SO + RE))
                isValid = false;
            else if (H < (D + T + HR))
                isValid = false;

            return isValid;
        }
    }
}
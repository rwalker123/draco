using System;
using System.Collections.Generic;
using System.Reflection;

namespace ModelObjects
{
	public class GameBatStatsComparer : IComparer<GameBatStats>
	{
		private string m_sortField = string.Empty;
		private bool m_ascending = true;

		public GameBatStatsComparer(string sortField)
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

		public int Compare(GameBatStats obj1, GameBatStats obj2)
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
	/// Summary description for GameBatStats
	/// </summary>
	public class GameBatStats
	{
		public long Id { get; set; }
		public long PlayerId { get; set; }
		public long GameId { get; set; }
		public long TeamId { get; set; }
		public int AB { get; set; }
		public int H { get; set; }
		public int R { get; set; }
		public int D { get; set; }
		public int T { get; set; }
		public int HR { get; set; }
		public int RBI { get; set; }
		public int SO { get; set; }
		public int BB { get; set; }
		public int RE { get; set; }
		public int HBP { get; set; }
		public int INTR { get; set; }
		public int SF { get; set; }
		public int SH { get; set; }
		public int SB { get; set; }
		public int CS { get; set; }
		public int LOB { get; set; }

		public GameBatStats()
		{
		}

		public GameBatStats(long statsId, long playerId, long gameId, long teamId, int ab,
						int h, int r, int d, int t, int hr, int rbi,
						int so, int bb, int re, int hbp, int intr,
						int sf, int sh, int sb, int cs, int lob)
		{
			Id = statsId;
			PlayerId = playerId;
			GameId = gameId;
			TeamId = teamId;
			AB = ab;
			H = h;
			R = r;
			D = d;
			T = t;
			HR = hr;
			RBI = rbi;
			SO = so;
			BB = bb;
			RE = re;
			HBP = hbp;
			INTR = intr;
			SF = sf;
			SH = sh;
			SB = sb;
			CS = cs;
			LOB = lob;
		}

		public int TB
		{
			get;
            set;
        }

        public double AVG
        {
            get;
            set;
        }

		public double SLG
		{
			get
            {
                return AB > 0 ? (double)TB / (double)AB : 0.000;
            }

            set
            {
                // make linq happy
            }
        }

		public double OBA
		{
			get
            {
                return (AB + BB + HBP) > 0 ? (double)(H + BB + HBP) / (double)(AB + BB + HBP) : 0.00;
            }

            set
            {
                // make linq happy
            }
        }

		public double OPS
		{
			get
            {
                return SLG + OBA;
            }

            set
            {
                // make linq happy
            }
        }

		public int PA
		{
			get
            {
                return AB + BB + HBP + SH + SF + INTR;
            }

            set
            {
                // make linq happy
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
            set
            {

            }
		}

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

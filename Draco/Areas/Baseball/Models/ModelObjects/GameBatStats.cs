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
	public class Batstatsum
	{
        public long Id { get; set; } // id (Primary key)
        public long PlayerId { get; set; } // PlayerId
        public long GameId { get; set; } // GameId
        public long TeamId { get; set; } // TeamId
        public int Ab { get; set; } // AB
        public int H { get; set; } // H
        public int R { get; set; } // R
        public int C2B { get; set; } // 2B
        public int C3B { get; set; } // 3B
        public int Hr { get; set; } // HR
        public int Rbi { get; set; } // RBI
        public int So { get; set; } // SO
        public int Bb { get; set; } // BB
        public int Re { get; set; } // RE
        public int Hbp { get; set; } // HBP
        public int Intr { get; set; } // INTR
        public int Sf { get; set; } // SF
        public int Sh { get; set; } // SH
        public int Sb { get; set; } // SB
        public int Cs { get; set; } // CS
        public int Lob { get; set; } // LOB
        public int? Tb { get; set; } // TB
        public int? Pa { get; set; } // PA
        public int? ObaDenominator { get; set; } // OBADenominator
        public int? ObaNumerator { get; set; } // OBANumerator
        public float? Avg { get; set; } // AVG

        // Foreign keys
        public virtual LeagueSchedule LeagueSchedule { get; set; } // FK_batstatsum_LeagueSchedule
        public virtual RosterSeason RosterSeason { get; set; } // FK_batstatsum_RosterSeason
        public virtual TeamsSeason TeamsSeason { get; set; } // FK_batstatsum_TeamsSeason

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

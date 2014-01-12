using System;

namespace ModelObjects
{
/// <summary>
/// Summary description for GameFieldStats
/// </summary>
	public class GameFieldStats
	{
		public long Id;
		public long PlayerId;
		public long GameId;
		public long TeamId;
		public int POS = 0; // Position
		public int IP = 0;  // innings played
		public int IP2 = 0; // fractional part of innings played (1 or 2) 1/3, 2/3
		public int PO = 0;  // put outs
		public int A = 0;   // assists
		public int E = 0;   // Errors
		public int PB = 0;  // Passed balls
		public int SB = 0;  // stolen bases
		public int CS = 0;  // caught Stealing

		public GameFieldStats()
		{
		}

		public GameFieldStats(long statsId, long playerId, long gameId, long teamId, int pos,
							  int ip, int ip2, int po, int a, int e, int pb, int sb,
							  int cs)
		{
			Id = statsId;
			PlayerId = playerId;
			GameId = gameId;
			TeamId = teamId;
			POS = pos;
			IP = ip;
			IP2 = ip2;
			PO = po;
			A = a;
			E = e;
			PB = pb;
			SB = sb;
			CS = cs;
		}

		public string StrPOS
		{
			get
			{
				String pos = "";

				switch (POS)
				{
					case 1:
						pos = "Pitcher";
						break;
					case 2:
						pos = "Catcher";
						break;
					case 3:
						pos = "First Base";
						break;
					case 4:
						pos = "Second Base";
						break;
					case 5:
						pos = "Third Base";
						break;
					case 6:
						pos = "Shortstop";
						break;
					case 7:
						pos = "Left Field";
						break;
					case 8:
						pos = "Center Field";
						break;
					case 9:
						pos = "Right Field";
						break;
					default:
						break;
				}

				return pos;
			}
		}

		public double CalculateIP()
		{
			return (double)(IP + (IP2 / 3)) + ((double)(IP2 % 3.0) / 3.0);
		}

		public double CSAVG
		{
			get
			{
				double csavg = 0.0;
				double chances = (double)CS + (double)SB;
				if (chances > 0)
					csavg = (double)CS / chances;

				return csavg;
			}
		}

		public double AVG
		{
			get
			{
				double favg = 0.0;
				double chances = PO + A + E;
				if (chances > 0.0)
					favg = (double)(PO + A) / chances;

				return favg;
			}
		}
	}
}

using ModelObjects;
using SportsManager.Controllers;
using SportsManager.Golf.Models;
using System;
using System.Collections.Generic;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class GolfScoreViewModel
	{
        IDb DB { get; }

		Dictionary<int, int> m_holeScores = new Dictionary<int, int>();

		// TODO: Move to database.
		const int ABSENT_PENALTY = 5;

		public GolfScoreViewModel(IDb db, GolfScore golfScore, GolfRoster player)
			: this(db, player)
		{
			InitializeScores(player.Id, golfScore);
		}

		/// <summary>
		/// Constructor to use when editing scores and the player is absent.
		/// </summary>
		/// <param name="player"></param>
		/// <param name="addAsAbsent"></param>
		public GolfScoreViewModel(IDb db, GolfRoster player, bool addAsAbsent = false)
		{
            DB = db;

			PlayerName = player.Contact.FirstName + " " + player.Contact.LastName;
			PlayerId = player.Id;
			IsFemale = player.Contact.IsFemale.GetValueOrDefault();
			// only support 9 holes so divide 18 hole InitialDifferential by 2.
			InitialDifferential = player.InitialDifferential / 2.0;

			InitialAbsent = addAsAbsent;
		}

		/// <summary>
		/// Constructor to use for creating "blind" player data.
		/// </summary>
		/// <param name="player"></param>
		/// <param name="course"></param>
		public GolfScoreViewModel(IDb db, GolfRoster player, GolfMatch forMatch, GolfTeeInformation teeInfo, int numHoles)
			: this(db, player)
		{
			CourseId = forMatch.CourseId.Value;
			TeeId = teeInfo.Id;
			TeePlayed = teeInfo.TeeColor;
			DatePlayed = forMatch.MatchDate;
			HolesPlayed = numHoles;
			InitialAbsent = true;

            GolfCourse = forMatch.GolfCourse;
			GolfTeeInformation = teeInfo;

			StartIndex = GolfScore.GetStartIndex(DB.CalculateHandicapIndexOnDate(player.Contact.Id, forMatch.MatchDate, true), IsFemale);
			CourseHandicap = GolfScore.CalculateCourseHandicap(StartIndex, teeInfo.GetSlope(IsFemale, HolesPlayed));

			int penalty = CourseHandicap.Value + ABSENT_PENALTY;

			// get penalty per hole.
			int holePenalty = penalty / HolesPlayed;

			// remainder is applied to hole handicaps <= handicapPenalty
			int handicapPenalty = penalty % HolesPlayed;

			for (int i = 1; i <= HolesPlayed; ++i)
			{
				int score = GolfCourse.GetHolePar(IsFemale, i) + holePenalty;
				if (GolfCourse.GetHoleHandicap(IsFemale, i) <= handicapPenalty)
					score++;

				AddScore(i, score);
			}
		}

		public void InitializeScores(long playerId, GolfScore golfScore)
		{
			AddScore(1, golfScore.HoleScore1);
			AddScore(2, golfScore.HoleScore2);
			AddScore(3, golfScore.HoleScore3);
			AddScore(4, golfScore.HoleScore4);
			AddScore(5, golfScore.HoleScore5);
			AddScore(6, golfScore.HoleScore6);
			AddScore(7, golfScore.HoleScore7);
			AddScore(8, golfScore.HoleScore8);
			AddScore(9, golfScore.HoleScore9);
			AddScore(10, golfScore.HoleScore10);
			AddScore(11, golfScore.HoleScore11);
			AddScore(12, golfScore.HoleScore12);
			AddScore(13, golfScore.HoleScore13);
			AddScore(14, golfScore.HoleScore14);
			AddScore(15, golfScore.HoleScore15);
			AddScore(16, golfScore.HoleScore16);
			AddScore(17, golfScore.HoleScore17);
			AddScore(18, golfScore.HoleScore18);


			CourseId = golfScore.CourseId;
			TeeId = golfScore.TeeId;
			TeePlayed = golfScore.GolfTeeInformation.TeeColor;
			DatePlayed = golfScore.DatePlayed;
			HolesPlayed = golfScore.HolesPlayed;

            GolfCourse = golfScore.GolfCourse;
			GolfTeeInformation = golfScore.GolfTeeInformation;

			if (golfScore.StartIndex9.HasValue)
				StartIndex = golfScore.StartIndex9.Value;
			else if (InitialDifferential.HasValue)
				StartIndex = GolfScore.CalculateIndex(InitialDifferential.Value, 1);
			else
				StartIndex = golfScore.GetStartIndex(IsFemale, for9Holes: true);

			CourseHandicap = GolfScore.CalculateCourseHandicap(StartIndex, golfScore.GetSlope());
		}

		private double StartIndex { get; set; }
		private double? InitialDifferential { get; set; }
		private bool IsFemale { get; set; }
		private GolfCourse GolfCourse { get; set; }
		private GolfTeeInformation GolfTeeInformation { get; set; }

		public bool InitialAbsent { get; private set; }

		public int HoleScore(int holeNo)
		{
			if (m_holeScores.ContainsKey(holeNo))
				return m_holeScores[holeNo];

			return 0;
		}

		public int NetHoleScoreToPar(int holeNo)
		{
			return NetScore(holeNo) - HolePar(holeNo);
		}

		private int HolePar(int holeNo)
		{
			return GolfCourse.GetHolePar(IsFemale, holeNo);
		}

		public int NetScore(int holeNo)
		{
			if (!CourseHandicap.HasValue || GolfCourse == null)
				return 0;

			if (m_holeScores.ContainsKey(holeNo))
			{
				int netAdjust = GetHoleAdjustment(holeNo);
				return m_holeScores[holeNo] - netAdjust;
			}
			return 0;
		}

		private int GetHoleAdjustment(int holeNo)
		{
			// get whole number adjustment, ex: playing 9 holes with a course handicap of 18 would be 2 strokes per hole
			// with no remainder.
			int holeAdjust = CourseHandicap.Value / HolesPlayed;

			// get the remainder which is mapped to hole handicap. ex: playing 9 holes with a course handicap 12. The 3 
			// remainder is applied to the 3 hardest holes.
			int holeHandicapLimit = CourseHandicap.Value % HolesPlayed;
			if (holeHandicapLimit != 0)
			{
				// get the hole handicap
				int holeHandicap = GolfCourse.GetHoleHandicap(IsFemale, holeNo);

				// if hole handicap is <= holeHandicapLimit include 1 more.
				if (holeHandicap <= holeHandicapLimit)
				{
					holeAdjust++;
				}
			}

			return holeAdjust;
		}

		public string PlayerName
		{
			get;
			set;
		}

		public long PlayerId
		{
			get;
			private set;
		}

		public long CourseId { get; set; }
		public long TeeId { get; set; }
		public string TeePlayed { get; set; }
		public DateTime DatePlayed { get; set; }
		public int HolesPlayed { get; set; }
		public int? CourseHandicap { get; private set; }
		public bool IsSub { get; set; }
		public string SubPlayerName { get; set; }
		public long SubPlayerId { get; set; }

		public int TotalScore
		{
			get
			{
				int totalScore = 0;
				for (int i = 0; i < HolesPlayed; ++i)
				{
					totalScore += m_holeScores[i + 1];
				}

				return totalScore;
			}
		}

		public double Differential
		{
			get
			{
				double rating = GolfTeeInformation.GetRating(IsFemale, HolesPlayed);
				double slope = GolfTeeInformation.GetSlope(IsFemale, HolesPlayed);

				int totalESCScore = TotalESCScore;

				if (HolesPlayed == 9)
					return GolfScore.CalculateDifferential(totalESCScore, rating / 2.0, slope) * 2;
				else
					return GolfScore.CalculateDifferential(totalESCScore, rating, slope);
			}
		}

		private int TotalESCScore
		{
			get
			{
				int totalESCScore = 0;
				for (int i = 1; i <= HolesPlayed; ++i)
				{
					totalESCScore += GolfScore.CalculateESCScore(HoleScore(i), HolePar(i), CourseHandicap.Value, HolesPlayed == 9);
				}

				return totalESCScore;
			}
		}

		public int TotalNetScore
		{
			get
			{
				return TotalScore - CourseHandicap.GetValueOrDefault(0);
			}
		}


		public void AddScore(int holeNo, int holeScore)
		{
			m_holeScores[holeNo] = holeScore;
		}

		internal static GolfScore GolfScoreFromViewModel(DB db, GolfScoreViewModel x)
		{
			GolfRoster rp = db.GolfRosters.Find(x.PlayerId);
			return new GolfScore()
			{
				CourseId = x.CourseId,
				ContactId = rp.ContactId,
				TeeId = x.TeeId,
				DatePlayed = x.DatePlayed,
				HolesPlayed = x.HolesPlayed,
				TotalScore = x.TotalScore,
				TotalsOnly = false,
				HoleScore1 = x.HoleScore(1),
				HoleScore2 = x.HoleScore(2),
				HoleScore3 = x.HoleScore(3),
				HoleScore4 = x.HoleScore(4),
				HoleScore5 = x.HoleScore(5),
				HoleScore6 = x.HoleScore(6),
				HoleScore7 = x.HoleScore(7),
				HoleScore8 = x.HoleScore(8),
				HoleScore9 = x.HoleScore(9),
				HoleScore10 = x.HoleScore(10),
				HoleScore11 = x.HoleScore(11),
				HoleScore12 = x.HoleScore(12),
				HoleScore13 = x.HoleScore(13),
				HoleScore14 = x.HoleScore(14),
				HoleScore15 = x.HoleScore(15),
				HoleScore16 = x.HoleScore(16),
				HoleScore17 = x.HoleScore(17),
				HoleScore18 = x.HoleScore(18),
			};

		}


	}
}
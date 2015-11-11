using ModelObjects;
using SportsManager.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace SportsManager.Golf.ViewModels
{
    public class PlayerViewModel
    {
        private DB DB { get; }
        public PlayerViewModel(DB db, GolfRoster rosterPlayer)
        {
            DB = db;

            RosterPlayer = rosterPlayer;

            Id = rosterPlayer.Id;
            ContactId = rosterPlayer.ContactId;
            TeamSeasonId = rosterPlayer.TeamSeasonId;
            InitialDifferential = rosterPlayer.InitialDifferential;

            if (rosterPlayer.ContactId != 0)
            {
                IsFemale = rosterPlayer.Contact.IsFemale.GetValueOrDefault();
                FirstName = rosterPlayer.Contact.FirstName;
                LastName = rosterPlayer.Contact.LastName;
                MiddleName = rosterPlayer.Contact.MiddleName;
            }
        }

        public class PlayerScoreViewModel
        {
            public PlayerScoreViewModel(GolfScore s, bool for9Holes, bool isFemale, double? initialDifferentail)
            {
                DatePlayed = s.DatePlayed;
                Slope = s.GolfTeeInformation.GetSlope(isFemale, s.HolesPlayed);
                Rating = s.GolfTeeInformation.GetRating(isFemale, s.HolesPlayed) / 2.0;
                ESCScore = s.TotalESCScore(for9Holes);
                CourseName = s.GolfCourse.Name;
                TeesPlayed = s.GolfTeeInformation.TeeColor;
                TotalScore = s.TotalScore;

                Differential = GolfScore.CalculateDifferential(ESCScore, Rating, Slope);
            }

            [DisplayName("Date"), DisplayFormat(DataFormatString = "{0:d}")]
            public DateTime DatePlayed { get; private set; }
            [DisplayName("Rating")]
            public double Rating { get; private set; }
            [DisplayName("Slope")]
            public double Slope { get; private set; }
            [DisplayName("ESC Score")]
            public int ESCScore { get; private set; }
            [DisplayName("Differential")]
            public double Differential { get; private set; }

            [DisplayName("Course")]
            public string CourseName { get; private set; }

            [DisplayName("Tees Played")]
            public string TeesPlayed { get; private set; }

            [DisplayName("Score")]
            public int TotalScore { get; private set; }

            public bool IsLowDiff { get; set; }
        }

        public void GetPlayerScoresForHandicap()
        {
            var scores = GetGolfScores(ContactId);

            PlayerScores = (from s in scores
                            orderby s.DatePlayed descending
                            select new PlayerScoreViewModel(s, true, IsFemale, InitialDifferential)).Take(20).ToList();

            int numScoresToUse = DBExtensions.GetLowestScoresToUse(PlayerScores.Count());

            var usedScores = (from s in PlayerScores
                              orderby s.Differential ascending
                              select s).Take(numScoresToUse);

            var usedDiffs = (from us in usedScores
                             select us.Differential);

            double avgDiffs = usedDiffs.Average();

            HandicapIndex = Math.Round(avgDiffs * .96, 1);
            AverageDiffs = Math.Round(avgDiffs, 1);

            foreach (var usedScore in usedScores)
                usedScore.IsLowDiff = true;
        }

        public void GetAllPlayerScores()
        {
            var scores = GetGolfScores(ContactId);

            PlayerScores = (from s in scores
                            orderby s.DatePlayed descending
                            select new PlayerScoreViewModel(s, true, IsFemale, InitialDifferential));
        }

        private IEnumerable<GolfScore> GetGolfScores(long contactId)
        {
            return (from gs in DB.GolfScores
                    where gs.ContactId == contactId
                    orderby gs.DatePlayed descending
                    select gs);
        }


        private GolfRoster RosterPlayer { get; set; }

        [ScaffoldColumn(false)]
        public IEnumerable<PlayerScoreViewModel> PlayerScores { get; private set; }

        [ScaffoldColumn(false)]
        public long Id { get; set; }

        [ScaffoldColumn(false)]
        public long ContactId { get; set; }

        [ScaffoldColumn(false)]
        public long TeamSeasonId { get; set; }

        [ScaffoldColumn(false), DisplayName("Player")]
        public string FullName
        {
            get { return FirstName + " " + LastName; }
        }

        [Required, StringLength(25), DisplayName("First Name")]
        public string FirstName { get; set; }

        [Required, StringLength(25), DisplayName("Last Name")]
        public string LastName { get; set; }

        [StringLength(25), DisplayName("Middle Name")]
        public string MiddleName { get; set; }

        [DisplayName("Is Female")]
        public bool IsFemale { get; set; }

        [DisplayName("Initial Differential")]
        public double? InitialDifferential { get; set; }

        public double AverageDiffs { get; private set; }

        [DisplayName("Handicap")]
        public double HandicapIndex { get; private set; }
    }
}
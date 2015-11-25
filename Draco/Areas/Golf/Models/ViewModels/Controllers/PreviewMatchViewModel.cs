using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using SportsManager.Golf.Models;
using SportsManager.ViewModels;
using SportsManager.Controllers;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class PreviewMatchViewModel : AccountViewModel
    {
        public PreviewMatchViewModel(DBController db, long accountId) : base(db, accountId)
        {

        }
        public PreviewMatchViewModel(DBController db, long accountId, long matchId) : base(db, accountId)
        {
            InitializeMatch(db, db.Db.GolfMatches.Find(matchId));
        }

        public PreviewMatchViewModel(DBController db, long accountId, GolfMatch match) : base(db, accountId)
        {
            InitializeMatch(db, match);
        }

        private void InitializeMatch(IDb db, GolfMatch match)
        {
            MatchId = match.Id;

            GolfMatch = match;

            if (GolfMatch != null)
            {
                GolfCourse course = Controller.Db.GolfCourses.Find(GolfMatch.CourseId.GetValueOrDefault(0));
                if (course != null)
                {
                    Course = Mapper.Map<GolfCourse, GolfCourseViewModel>(course);
                    db.AddTees(Course);
                    CoursePlayed = course.Name;
                    CourseId = course.Id;
                }

                Team1Name = GolfMatch.TeamsSeason_Team1?.Name;
                Team2Name = GolfMatch.TeamsSeason_Team2?.Name;

                Team1Id = GolfMatch.Team1;
                Team2Id = GolfMatch.Team2;

                MatchDate = GolfMatch.MatchDate;
                MatchTime = GolfMatch.MatchTime;
                MatchType = GolfMatch.MatchType;
                Comment = GolfMatch.Comment;
                MatchStatus = GolfMatch.MatchStatus;

                long accountId = GolfMatch.LeagueSeason.League.AccountId;

                var team1Players = Controller.Db.GolfRosters.Where(gr => gr.TeamSeasonId == Team1Id);
                Team1Players = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PreviewMatchPlayerViewModel>>(team1Players);

                var team2Players = Controller.Db.GolfRosters.Where(gr => gr.TeamSeasonId == Team2Id);
                Team2Players = Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PreviewMatchPlayerViewModel>>(team2Players);
            }
        }

        private GolfTeeInformation GetDefaultTeeInfo(long accountId, long courseId, bool isFemale)
        {
            return Controller.GetDefaultCourseTee(accountId, courseId, isFemale);
        }

        private GolfMatch GolfMatch { get; set; }

        public long MatchId { get; private set; }

        public DateTime MatchDate { get; private set; }
        public DateTime MatchTime { get; private set; }

        public int MatchType { get; private set; }

        public string Comment { get; private set; }
        public int MatchStatus { get; private set; }

        public string CoursePlayed { get; private set; }
        public long CourseId { get; private set; }

        public GolfCourseViewModel Course { get; private set; }

        public int NumberHolesPlayed { get { return 9; } }

        public long Team1Id { get; private set; }
        public string Team1Name { get; private set; }

        public long Team2Id { get; private set; }
        public string Team2Name { get; private set; }

        public IEnumerable<PreviewMatchPlayerViewModel> Team1Players
        {
            get;
            private set;
        }

        public IEnumerable<PreviewMatchPlayerViewModel> Team2Players
        {
            get;
            private set;
        }

        public IEnumerable<PlayerViewModel> GetAvailableSubs(long seasonId)
        {
            var subs = Controller.GetSubs(seasonId);
            return Mapper.Map<IQueryable<GolfRoster>, IEnumerable<PlayerViewModel>>(subs);
        }
    }
}
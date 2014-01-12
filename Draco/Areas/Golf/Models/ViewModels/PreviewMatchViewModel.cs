using System;
using System.Collections.Generic;
using System.Linq;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels
{
    public class PreviewMatchViewModel
    {
        public PreviewMatchViewModel(long matchId)
        {
            InitializeMatch(DataAccess.Golf.GolfMatches.GetMatch(matchId));
        }

        public PreviewMatchViewModel(GolfMatch match)
        {
            InitializeMatch(match);
        }

        private void InitializeMatch(GolfMatch match)
        {
            MatchId = match.Id;

            GolfMatch = match;

            if (GolfMatch != null)
            {
                GolfCourse course = DataAccess.Golf.GolfCourses.GetCourse(GolfMatch.CourseId.GetValueOrDefault(0));
                if (course != null)
                {
                    Course = GolfCourseViewModel.GetCourseViewModel(0, course);
                    Course.AddTees();
                }

                CoursePlayed = DataAccess.Golf.GolfCourses.GetCourseName(GolfMatch.CourseId.GetValueOrDefault(0));
                CourseId = GolfMatch.CourseId.GetValueOrDefault(0);

                Team1Name = DataAccess.Teams.GetTeamName(GolfMatch.Team1);
                Team2Name = DataAccess.Teams.GetTeamName(GolfMatch.Team2);

                Team1Id = GolfMatch.Team1;
                Team2Id = GolfMatch.Team2;

                MatchDate = GolfMatch.MatchDate;
                MatchTime = GolfMatch.MatchTime;
                MatchType = GolfMatch.MatchType;
                Comment = GolfMatch.Comment;
                MatchStatus = GolfMatch.MatchStatus;

                long accountId = GolfMatch.LeagueSeason.League.AccountId;

                IEnumerable<GolfRoster> team1Players = DataAccess.Golf.GolfRosters.GetRoster(Team1Id);
                Team1Players = (from t1 in team1Players
                                select new PreviewMatchPlayerViewModel(t1, GolfMatch, DataAccess.Golf.GolfLeagues.GetDefaultCourseTee(accountId, CourseId, t1.Contact.IsFemale.GetValueOrDefault()), 9));

                IEnumerable<GolfRoster> team2Players = DataAccess.Golf.GolfRosters.GetRoster(Team2Id);
                Team2Players = (from t2 in team2Players
                                select new PreviewMatchPlayerViewModel(t2, GolfMatch, DataAccess.Golf.GolfLeagues.GetDefaultCourseTee(accountId, CourseId, t2.Contact.IsFemale.GetValueOrDefault()), 9));
            }
        }

        private GolfTeeInformation GetDefaultTeeInfo(long accountId, long courseId, bool isFemale)
        {
            return DataAccess.Golf.GolfLeagues.GetDefaultCourseTee(accountId, courseId, isFemale);
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
            IEnumerable<GolfRoster> subs = DataAccess.Golf.GolfRosters.GetSubs(seasonId);

            // convert to TeamViewModel
            return (from s in subs
                    select new PlayerViewModel(s));
        }
    }
}
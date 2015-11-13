using System.Collections.Generic;
using DataAccess.Golf;
using SportsManager.Model;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class PreviewMatchPlayerViewModel
    {
        private List<string> m_holeHandicaps = new List<string>(18);

        public PreviewMatchPlayerViewModel(GolfRoster player, GolfMatch match, GolfTeeInformation teeInfo, int numHoles)
        {
            Player = player;
            Match = match;

            HolesPlayed = numHoles;
            IsFemale = player.Contact.IsFemale.GetValueOrDefault();

            GolfCourse = DataAccess.Golf.GolfCourses.GetCourse(match.CourseId.Value);
            GolfTeeInformation = teeInfo;

            double startIndex = GolfScore.GetStartIndex(GolfScores.CalculateHandicapIndexOnDate(player.Contact.Id, match.MatchDate, true), IsFemale);
            CourseHandicap = GolfScore.CalculateCourseHandicap(startIndex, teeInfo.GetSlope(IsFemale, HolesPlayed));

            // get per hole handicaps for player.
            int perHoleHandicap = (int)(CourseHandicap / (double)HolesPlayed);
            int remainderHoleHandicap = (int)(CourseHandicap % (double)HolesPlayed);

            for (int i = 1; i <= HolesPlayed; i++)
            {
                int holeHandicap = GolfCourse.GetHoleHandicap(IsFemale, i);
                int playerHandicap = perHoleHandicap;
                if (holeHandicap <= remainderHoleHandicap)
                    playerHandicap++;

                playerHandicap *= -1;

                string strHandicap = (playerHandicap == 0) ? string.Empty : playerHandicap.ToString();

                m_holeHandicaps.Add(strHandicap);
            }
        }

        public string HoleHandicap(int holeNo)
        {
            return m_holeHandicaps[holeNo - 1];
        }

        public GolfCourse GolfCourse
        {
            get;
            private set;
        }

        public GolfTeeInformation GolfTeeInformation
        {
            get;
            private set;
        }

        public int HolesPlayed
        {
            get;
            private set;
        }

        public bool IsFemale
        {
            get;
            private set;
        }

        public double CourseHandicap
        {
            get;
            private set;
        }

        public GolfRoster Player
        {
            get;
            private set;
        }

        public GolfMatch Match
        {
            get;
            private set;
        }

        public long PlayerId
        {
            get { return Player.Id; }
        }

        public string FullName
        {
            get { return Player.Contact.FirstName + " " + Player.Contact.LastName; }
        }
    }
}
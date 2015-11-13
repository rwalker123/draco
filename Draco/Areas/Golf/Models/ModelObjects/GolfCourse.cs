using System;
using System.Collections.Generic;
using System.Linq;

namespace SportsManager.Golf.Models
{
	/// <summary>
	/// Summary description for GolfCourse
	/// </summary>
	public class GolfCourse
	{
        public long Id { get; set; } // Id (Primary key)
        public string Name { get; set; } // Name
        public string Designer { get; set; } // Designer
        public int? YearBuilt { get; set; } // YearBuilt
        public int NumberOfHoles { get; set; } // NumberOfHoles
        public string Address { get; set; } // Address
        public string City { get; set; } // City
        public string State { get; set; } // State
        public string Zip { get; set; } // Zip
        public string Country { get; set; } // Country

        // Reverse navigation
        public virtual ICollection<GolfCourseForContact> GolfCourseForContacts { get; set; } // GolfCourseForContact.FK_GolfCourseForContact_GolfCourse
        public virtual ICollection<GolfLeagueCourse> GolfLeagueCourse { get; set; } // Many to many mapping
        public virtual ICollection<GolfMatch> GolfMatches { get; set; } // GolfMatch.FK_GolfMatch_GolfCourse
        public virtual ICollection<GolfScore> GolfScores { get; set; } // GolfScore.FK_GolfScore_GolfCourse
        public virtual ICollection<GolfTeeInformation> GolfTeeInformations { get; set; } // GolfTeeInformation.FK_GolfTeeInformation_GolfCourse

        public virtual IList<GolfCourseMenPar> MensPars { get; set; }
        public virtual IList<GolfCourseWomenPar> WomensPars { get; set; }

        public GolfCourse()
        {
            GolfCourseForContacts = new List<GolfCourseForContact>();
            GolfLeagueCourse = new List<GolfLeagueCourse>();
            GolfMatches = new List<GolfMatch>();
            GolfScores = new List<GolfScore>();
            GolfTeeInformations = new List<GolfTeeInformation>();
            MensPars = new List<GolfCourseMenPar>();
            WomensPars = new List<GolfCourseWomenPar>();
        }

        public string NameCity
		{
			get
			{
				if (!String.IsNullOrEmpty(City))
					return Name + " (" + City + ")";
				else
					return Name;
			}
		}

		public int GetHoleHandicap(bool isFemale, int holeNo)
		{
			int holeHandicap = 0;

			if (isFemale)
				holeHandicap = WomansHandicap(holeNo);

			if (holeHandicap == 0)
				holeHandicap = MensHandicap(holeNo);

			return holeHandicap;
		}

		public int GetHolePar(bool isFemale, int holeNo)
		{
			int holePar = 0;

			if (isFemale)
				holePar = WomansPar(holeNo);

			if (holePar == 0)
				holePar = MensPar(holeNo);

			return holePar;
		}

		public void MensPar(int holeNo, int parVal)
		{
            var mp = (from m in this.MensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                mp.Par = parVal;
		}

		public void MensHandicap(int holeNo, int handicapVal)
		{
            var mp = (from m in this.MensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                mp.Handicap = handicapVal;
        }

        public void WomansHandicap(int holeNo, int handicapVal)
		{
            var mp = (from m in this.WomensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                mp.Handicap = handicapVal;
        }

        public void WomansPar(int holeNo, int parVal)
		{
            var mp = (from m in this.WomensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                mp.Par = parVal;
        }


        public int MensPar(int holeNo)
		{
            var mp = (from m in this.MensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                return mp.Par;

            return 0;
        }

        public int WomansPar(int holeNo)
		{
            var mp = (from m in this.WomensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                return mp.Par;

            return 0;
        }

        public int MensHandicap(int holeNo)
		{
            var mp = (from m in this.MensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                return mp.Handicap;

            return 0;
		}

		public int WomansHandicap(int holeNo)
		{
            var mp = (from m in this.WomensPars
                      where m.HoleNo == holeNo
                      select m).SingleOrDefault();
            if (mp != null)
                return mp.Handicap;

            return 0;
		}
	}
}

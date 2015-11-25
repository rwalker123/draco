using System.Collections.Generic;
using System.Linq;
using SportsManager;
using SportsManager.Model;

namespace DataAccess.Golf
{
	/// <summary>
	/// Summary description for GolfCourse
	/// </summary>
	static public class GolfCourses
	{
		static public string GetCourseName(long courseId)
		{
            DB db = DBConnection.GetContext();

			return (from gc in db.GolfCourses
					where gc.Id == courseId
					select gc.Name).SingleOrDefault();
		}

		static public GolfCourse GetCourse(long courseId)
		{
            DB db = DBConnection.GetContext();

			return (from gc in db.GolfCourses
					where gc.Id == courseId
					select gc).SingleOrDefault();
		}

		static public IEnumerable<GolfCourse> GetCoursesForUser(long contactId)
		{
            DB db = DBConnection.GetContext();

			return (from gcfc in db.GolfCourseForContacts
					join gc in db.GolfCourses on gcfc.CourseId equals gc.Id
					into j1
					from gcfc_gc in j1
					where gcfc.ContactId == contactId
					select gcfc_gc);
		}

		static public IEnumerable<GolfCourse> GetAllCourses()
		{
            DB db = DBConnection.GetContext();

			return (from gc in db.GolfCourses
					select gc);
		}

		static public IEnumerable<GolfCourse> GetLeagueCourses(long accountId)
		{
            DB db = DBConnection.GetContext();

			return (from gcc in db.GolfLeagueCourses
					join gc in db.GolfCourses on gcc.CourseId equals gc.Id
					into j1
					from gcc_gc in j1
					where gcc.AccountId == accountId
					select gcc_gc);
		}

		static public IEnumerable<GolfCourse> GetUserGolfCourseOrSearch(long contactId, string searchString)
		{
			if (string.IsNullOrEmpty(searchString))
				return GetCoursesIdAndNameForUser(contactId);
			else
				return FindGolfCourseGetIdAndName(searchString);
		}


		static public IEnumerable<GolfCourse> FindGolfCourseGetIdAndName(string searchString)
		{
            DB db = DBConnection.GetContext();

			return (from gc in db.GolfCourses
					where gc.Name.Contains(searchString)
					select gc);
		}

		static public IEnumerable<GolfCourse> GetCoursesIdAndNameForUser(long contactId)
		{
            DB db = DBConnection.GetContext();

			return (from gcc in db.GolfCourseForContacts
					join gc in db.GolfCourses on gcc.CourseId equals gc.Id
					into j1
					from gcc_gc in j1
					where gcc.ContactId == contactId
					select gcc_gc);

		}

		static public IEnumerable<GolfTeeInformation> GetTeesForCourse(long courseId)
		{
            DB db = DBConnection.GetContext();

			return (from ti in db.GolfTeeInformations
					where ti.CourseId == courseId
					orderby ti.Priority ascending
					select ti);
		}

		static public long AddGolfCourse(GolfCourse course)
		{
            DB db = DBConnection.GetContext();

			db.GolfCourses.InsertOnSubmit(course);
			db.SubmitChanges();

			return course.Id;
		}

		static public void AddGolfLeagueCourse(GolfLeagueCourse glc)
		{
            DB db = DBConnection.GetContext();

			db.GolfLeagueCourses.InsertOnSubmit(glc);
			db.SubmitChanges();
		}

		static public long AddGolfTeeInformation(GolfTeeInformation teeInfo)
		{
            DB db = DBConnection.GetContext();

			db.GolfTeeInformations.InsertOnSubmit(teeInfo);
			db.SubmitChanges();

			return teeInfo.Id;
		}

		static public bool ModifyGolfCourse(GolfCourse course)
		{
            DB db = DBConnection.GetContext();

			GolfCourse dbCourse = (from gc in db.GolfCourses
								   where gc.Id == course.Id
								   select gc).SingleOrDefault();

			dbCourse.Name = course.Name;
			dbCourse.Address = course.Address;
			dbCourse.City = course.City;
			dbCourse.State = course.State;
			dbCourse.Zip = dbCourse.Zip;
			dbCourse.Designer = course.Designer;
			dbCourse.Country = dbCourse.Country;
			dbCourse.YearBuilt = dbCourse.YearBuilt;
			dbCourse.NumberOfHoles = course.NumberOfHoles;
			dbCourse.MensHandicap1 = course.MensHandicap1;
			dbCourse.MensHandicap2 = course.MensHandicap2;
			dbCourse.MensHandicap3 = course.MensHandicap3;
			dbCourse.MensHandicap4 = course.MensHandicap4;
			dbCourse.MensHandicap5 = course.MensHandicap5;
			dbCourse.MensHandicap6 = course.MensHandicap6;
			dbCourse.MensHandicap7 = course.MensHandicap7;
			dbCourse.MensHandicap8 = course.MensHandicap8;
			dbCourse.MensHandicap9 = course.MensHandicap9;
			dbCourse.MensHandicap10 = course.MensHandicap10;
			dbCourse.MensHandicap11 = course.MensHandicap11;
			dbCourse.MensHandicap12 = course.MensHandicap12;
			dbCourse.MensHandicap13 = course.MensHandicap13;
			dbCourse.MensHandicap14 = course.MensHandicap14;
			dbCourse.MensHandicap15 = course.MensHandicap15;
			dbCourse.MensHandicap16 = course.MensHandicap16;
			dbCourse.MensHandicap17 = course.MensHandicap17;
			dbCourse.MensHandicap18 = course.MensHandicap18;
			dbCourse.MensPar1 = course.MensPar1;
			dbCourse.MensPar2 = course.MensPar2;
			dbCourse.MensPar3 = course.MensPar3;
			dbCourse.MensPar4 = course.MensPar4;
			dbCourse.MensPar5 = course.MensPar5;
			dbCourse.MensPar6 = course.MensPar6;
			dbCourse.MensPar7 = course.MensPar7;
			dbCourse.MensPar8 = course.MensPar8;
			dbCourse.MensPar9 = course.MensPar9;
			dbCourse.MensPar10 = course.MensPar10;
			dbCourse.MensPar11 = course.MensPar11;
			dbCourse.MensPar12 = course.MensPar12;
			dbCourse.MensPar13 = course.MensPar13;
			dbCourse.MensPar14 = course.MensPar14;
			dbCourse.MensPar15 = course.MensPar15;
			dbCourse.MensPar16 = course.MensPar16;
			dbCourse.MensPar17 = course.MensPar17;
			dbCourse.MensPar18 = course.MensPar18;
			dbCourse.WomansHandicap1 = course.WomansHandicap1;
			dbCourse.WomansHandicap2 = course.WomansHandicap2;
			dbCourse.WomansHandicap3 = course.WomansHandicap3;
			dbCourse.WomansHandicap4 = course.WomansHandicap4;
			dbCourse.WomansHandicap5 = course.WomansHandicap5;
			dbCourse.WomansHandicap6 = course.WomansHandicap6;
			dbCourse.WomansHandicap7 = course.WomansHandicap7;
			dbCourse.WomansHandicap8 = course.WomansHandicap8;
			dbCourse.WomansHandicap9 = course.WomansHandicap9;
			dbCourse.WomansHandicap10 = course.WomansHandicap10;
			dbCourse.WomansHandicap11 = course.WomansHandicap11;
			dbCourse.WomansHandicap12 = course.WomansHandicap12;
			dbCourse.WomansHandicap13 = course.WomansHandicap13;
			dbCourse.WomansHandicap14 = course.WomansHandicap14;
			dbCourse.WomansHandicap15 = course.WomansHandicap15;
			dbCourse.WomansHandicap16 = course.WomansHandicap16;
			dbCourse.WomansHandicap17 = course.WomansHandicap17;
			dbCourse.WomansHandicap18 = course.WomansHandicap18;
			dbCourse.WomansPar1 = course.WomansPar1;
			dbCourse.WomansPar2 = course.WomansPar2;
			dbCourse.WomansPar3 = course.WomansPar3;
			dbCourse.WomansPar4 = course.WomansPar4;
			dbCourse.WomansPar5 = course.WomansPar5;
			dbCourse.WomansPar6 = course.WomansPar6;
			dbCourse.WomansPar7 = course.WomansPar7;
			dbCourse.WomansPar8 = course.WomansPar8;
			dbCourse.WomansPar9 = course.WomansPar9;
			dbCourse.WomansPar10 = course.WomansPar10;
			dbCourse.WomansPar11 = course.WomansPar11;
			dbCourse.WomansPar12 = course.WomansPar12;
			dbCourse.WomansPar13 = course.WomansPar13;
			dbCourse.WomansPar14 = course.WomansPar14;
			dbCourse.WomansPar15 = course.WomansPar15;
			dbCourse.WomansPar16 = course.WomansPar16;
			dbCourse.WomansPar17 = course.WomansPar17;
			dbCourse.WomansPar18 = course.WomansPar18;

			db.SubmitChanges();

			return true;
		}

		static public bool RemoveGolfCourse(long courseId)
		{
            DB db = DBConnection.GetContext();

			var dbCourse = (from gc in db.GolfCourses
							where gc.Id == courseId
							select gc).SingleOrDefault();

			if (dbCourse != null)
			{
				db.GolfCourses.DeleteOnSubmit(dbCourse);
				db.SubmitChanges();
			}

			return true;
		}
	}
}
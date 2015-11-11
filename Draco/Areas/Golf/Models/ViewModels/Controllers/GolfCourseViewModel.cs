
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using SportsManager.Models;
using SportsManager.ViewModels;
using SportsManager.Controllers;

namespace SportsManager.Golf.ViewModels
{
	public class GolfCourseViewModel : AccountViewModel
	{
		public GolfCourseViewModel(DBController c, long accountId)
            : base(c, accountId)
		{
			AccountId = accountId;

			MensPar = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
			WomensPar = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
			MensHandicap = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
			WomensHandicap = new List<int>(18) { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };

			Tees = new List<GolfTeeViewModel>();
		}

		[ScaffoldColumn(false)]
		public long CourseId { get; set; }

		[Required, StringLength(100)]
		public string Name { get; set; }

		[StringLength(50)]
		public string Designer { get; set; }

		[Required, Range(9, 18), DisplayName("Number of Holes")]
		public int NumberOfHoles { get; set; }

		[StringLength(50)]
		public string Address { get; set; }

		[StringLength(50)]
		public string City { get; set; }

		[StringLength(50)]
		public string State { get; set; }

		[StringLength(50)]
		public string Zip { get; set; }

		[UIHint("IntCollectionData")]
		public IList<int> MensPar { get; set; }

		[UIHint("IntCollectionData")]
		public IList<int> MensHandicap { get; set; }

		[UIHint("IntCollectionData")]
		public IList<int> WomensPar { get; set; }

		[UIHint("IntCollectionData")]
		public IList<int> WomensHandicap { get; set; }

		[ScaffoldColumn(false)]
		public IList<GolfTeeViewModel> Tees { get; private set; }

		public void AddTees()
		{
			IEnumerable<GolfTeeInformation> teeInfos = GetTeesForCourse(CourseId);
			foreach (GolfTeeInformation teeInfo in teeInfos)
			{
				Tees.Add(GolfTeeViewModel.GetCourseTeeViewModel(teeInfo));
			}
		}

        private IEnumerable<GolfTeeInformation> GetTeesForCourse(long courseId)
        {
            return (from ti in Controller.Db.GolfTeeInformations
                    where ti.CourseId == courseId
                    orderby ti.Priority ascending
                    select ti);
        }

        public static GolfCourseViewModel GetCourseViewModel(DBController c, long accountId, GolfCourse course)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel(c, accountId)
			{
				CourseId = course.Id,
				Name = course.Name,
				NumberOfHoles = course.NumberOfHoles
			};

			vm.MensPar[0] = course.MensPar1;
			vm.MensPar[1] = course.MensPar2;
			vm.MensPar[2] = course.MensPar3;
			vm.MensPar[3] = course.MensPar4;
			vm.MensPar[4] = course.MensPar5;
			vm.MensPar[5] = course.MensPar6;
			vm.MensPar[6] = course.MensPar7;
			vm.MensPar[7] = course.MensPar8;
			vm.MensPar[8] = course.MensPar9;
			vm.MensPar[9] = course.MensPar10;
			vm.MensPar[10] = course.MensPar11;
			vm.MensPar[11] = course.MensPar12;
			vm.MensPar[12] = course.MensPar13;
			vm.MensPar[13] = course.MensPar14;
			vm.MensPar[14] = course.MensPar15;
			vm.MensPar[15] = course.MensPar16;
			vm.MensPar[16] = course.MensPar17;
			vm.MensPar[17] = course.MensPar18;

			vm.MensHandicap[0] = course.MensHandicap1;
			vm.MensHandicap[1] = course.MensHandicap2;
			vm.MensHandicap[2] = course.MensHandicap3;
			vm.MensHandicap[3] = course.MensHandicap4;
			vm.MensHandicap[4] = course.MensHandicap5;
			vm.MensHandicap[5] = course.MensHandicap6;
			vm.MensHandicap[6] = course.MensHandicap7;
			vm.MensHandicap[7] = course.MensHandicap8;
			vm.MensHandicap[8] = course.MensHandicap9;
			vm.MensHandicap[9] = course.MensHandicap10;
			vm.MensHandicap[10] = course.MensHandicap11;
			vm.MensHandicap[11] = course.MensHandicap12;
			vm.MensHandicap[12] = course.MensHandicap13;
			vm.MensHandicap[13] = course.MensHandicap14;
			vm.MensHandicap[14] = course.MensHandicap15;
			vm.MensHandicap[15] = course.MensHandicap16;
			vm.MensHandicap[16] = course.MensHandicap17;
			vm.MensHandicap[17] = course.MensHandicap18;

			vm.WomensPar[0] = course.WomansPar1;
			vm.WomensPar[1] = course.WomansPar2;
			vm.WomensPar[2] = course.WomansPar3;
			vm.WomensPar[3] = course.WomansPar4;
			vm.WomensPar[4] = course.WomansPar5;
			vm.WomensPar[5] = course.WomansPar6;
			vm.WomensPar[6] = course.WomansPar7;
			vm.WomensPar[7] = course.WomansPar8;
			vm.WomensPar[8] = course.WomansPar9;
			vm.WomensPar[9] = course.WomansPar10;
			vm.WomensPar[10] = course.WomansPar11;
			vm.WomensPar[11] = course.WomansPar12;
			vm.WomensPar[12] = course.WomansPar13;
			vm.WomensPar[13] = course.WomansPar14;
			vm.WomensPar[14] = course.WomansPar15;
			vm.WomensPar[15] = course.WomansPar16;
			vm.WomensPar[16] = course.WomansPar17;
			vm.WomensPar[17] = course.WomansPar18;

			vm.WomensHandicap[0] = course.WomansHandicap1;
			vm.WomensHandicap[1] = course.WomansHandicap2;
			vm.WomensHandicap[2] = course.WomansHandicap3;
			vm.WomensHandicap[3] = course.WomansHandicap4;
			vm.WomensHandicap[4] = course.WomansHandicap5;
			vm.WomensHandicap[5] = course.WomansHandicap6;
			vm.WomensHandicap[6] = course.WomansHandicap7;
			vm.WomensHandicap[7] = course.WomansHandicap8;
			vm.WomensHandicap[8] = course.WomansHandicap9;
			vm.WomensHandicap[9] = course.WomansHandicap10;
			vm.WomensHandicap[10] = course.WomansHandicap11;
			vm.WomensHandicap[11] = course.WomansHandicap12;
			vm.WomensHandicap[12] = course.WomansHandicap13;
			vm.WomensHandicap[13] = course.WomansHandicap14;
			vm.WomensHandicap[14] = course.WomansHandicap15;
			vm.WomensHandicap[15] = course.WomansHandicap16;
			vm.WomensHandicap[16] = course.WomansHandicap17;
			vm.WomensHandicap[17] = course.WomansHandicap18;

			return vm;
		}

		public static GolfCourse GetCourseFromViewModel(GolfCourseViewModel vm)
		{
			return new GolfCourse()
			{
				Id = vm.CourseId,
				Name = vm.Name,
				NumberOfHoles = vm.NumberOfHoles,
				MensHandicap1 = vm.MensHandicap[0],
				MensHandicap2 = vm.MensHandicap[1],
				MensHandicap3 = vm.MensHandicap[2],
				MensHandicap4 = vm.MensHandicap[3],
				MensHandicap5 = vm.MensHandicap[4],
				MensHandicap6 = vm.MensHandicap[5],
				MensHandicap7 = vm.MensHandicap[6],
				MensHandicap8 = vm.MensHandicap[7],
				MensHandicap9 = vm.MensHandicap[8],
				MensHandicap10 = vm.MensHandicap[9],
				MensHandicap11 = vm.MensHandicap[10],
				MensHandicap12 = vm.MensHandicap[11],
				MensHandicap13 = vm.MensHandicap[12],
				MensHandicap14 = vm.MensHandicap[13],
				MensHandicap15 = vm.MensHandicap[14],
				MensHandicap16 = vm.MensHandicap[15],
				MensHandicap17 = vm.MensHandicap[16],
				MensHandicap18 = vm.MensHandicap[17],
				MensPar1 = vm.MensPar[0],
				MensPar2 = vm.MensPar[1],
				MensPar3 = vm.MensPar[2],
				MensPar4 = vm.MensPar[3],
				MensPar5 = vm.MensPar[4],
				MensPar6 = vm.MensPar[5],
				MensPar7 = vm.MensPar[6],
				MensPar8 = vm.MensPar[7],
				MensPar9 = vm.MensPar[8],
				MensPar10 = vm.MensPar[9],
				MensPar11 = vm.MensPar[10],
				MensPar12 = vm.MensPar[11],
				MensPar13 = vm.MensPar[12],
				MensPar14 = vm.MensPar[13],
				MensPar15 = vm.MensPar[14],
				MensPar16 = vm.MensPar[15],
				MensPar17 = vm.MensPar[16],
				MensPar18 = vm.MensPar[17],
				WomansHandicap1 = vm.WomensHandicap[0],
				WomansHandicap2 = vm.WomensHandicap[1],
				WomansHandicap3 = vm.WomensHandicap[2],
				WomansHandicap4 = vm.WomensHandicap[3],
				WomansHandicap5 = vm.WomensHandicap[4],
				WomansHandicap6 = vm.WomensHandicap[5],
				WomansHandicap7 = vm.WomensHandicap[6],
				WomansHandicap8 = vm.WomensHandicap[7],
				WomansHandicap9 = vm.WomensHandicap[8],
				WomansHandicap10 = vm.WomensHandicap[9],
				WomansHandicap11 = vm.WomensHandicap[10],
				WomansHandicap12 = vm.WomensHandicap[11],
				WomansHandicap13 = vm.WomensHandicap[12],
				WomansHandicap14 = vm.WomensHandicap[13],
				WomansHandicap15 = vm.WomensHandicap[14],
				WomansHandicap16 = vm.WomensHandicap[15],
				WomansHandicap17 = vm.WomensHandicap[16],
				WomansHandicap18 = vm.WomensHandicap[17],
				WomansPar1 = vm.WomensPar[0],
				WomansPar2 = vm.WomensPar[1],
				WomansPar3 = vm.WomensPar[2],
				WomansPar4 = vm.WomensPar[3],
				WomansPar5 = vm.WomensPar[4],
				WomansPar6 = vm.WomensPar[5],
				WomansPar7 = vm.WomensPar[6],
				WomansPar8 = vm.WomensPar[7],
				WomansPar9 = vm.WomensPar[8],
				WomansPar10 = vm.WomensPar[9],
				WomansPar11 = vm.WomensPar[10],
				WomansPar12 = vm.WomensPar[11],
				WomansPar13 = vm.WomensPar[12],
				WomansPar14 = vm.WomensPar[13],
				WomansPar15 = vm.WomensPar[14],
				WomansPar16 = vm.WomensPar[15],
				WomansPar17 = vm.WomensPar[16],
				WomansPar18 = vm.WomensPar[17],
			};

		}
	}
}
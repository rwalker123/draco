
using SportsManager.Controllers;
using SportsManager.Models;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace SportsManager.Golf.ViewModels
{
    public class GolfCourseViewModel
	{
		public GolfCourseViewModel()
		{
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

        public static GolfCourseViewModel GetCourseViewModel(GolfCourse course)
		{
			GolfCourseViewModel vm = new GolfCourseViewModel()
			{
				CourseId = course.Id,
				Name = course.Name,
				NumberOfHoles = course.NumberOfHoles
			};

			return vm;
		}

	}
}
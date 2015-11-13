using SportsManager.Controllers;
using SportsManager.Golf.Models;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace SportsManager.Golf.ViewModels.Controllers
{
    public class GolfCoursesViewModel : AccountViewModel
    {
        public GolfCoursesViewModel(DBController c, long accountId) : base(c, accountId)
        {
            Courses = c.Db.GolfLeagueCourses.Where(glc => glc.AccountId == accountId);
        }

		[ScaffoldColumn(false)]
        public IEnumerable<GolfLeagueCourse> Courses { get; }
    }
}
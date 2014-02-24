using ModelObjects;
using SportsManager;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess
{
	/// <summary>
	/// Summary description for TeamHandouts
	/// </summary>
	static public class TeamHandouts
	{
		static public TeamHandout GetHandout(long id)
		{
            DB db = DBConnection.GetContext();

            return (from h in db.TeamHandouts
                    where h.Id == id
                    select new TeamHandout()
                    {
                        Id = h.Id,
                        Description = h.Description,
                        ReferenceId = h.TeamId,
                        FileName = h.FileName
                    }).SingleOrDefault();
		}

		static public IQueryable<TeamHandout> GetTeamHandouts(long teamId)
		{
            DB db = DBConnection.GetContext();

            return (from h in db.TeamHandouts
                    where h.TeamId == teamId
                    select new TeamHandout()
                    {
                        Id = h.Id,
                        Description = h.Description,
                        ReferenceId = h.TeamId,
                        FileName = h.FileName
                    });
		}

		static public bool ModifyTeamHandout(TeamHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbItem = (from h in db.TeamHandouts
                          where h.Id == item.Id
                          select h).SingleOrDefault();

            if (dbItem != null)
            {
                dbItem.Description = item.Description;
                db.SubmitChanges();
                return true;
            }

            return false;
		}

		static public bool AddTeamHandout(TeamHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbItem = new SportsManager.Model.TeamHandout()
            {
                FileName = item.FileName,
                Description = item.Description,
                TeamId = item.ReferenceId
            };

            db.TeamHandouts.InsertOnSubmit(dbItem);
            db.SubmitChanges();

            item.Id = dbItem.Id;

            return true;
		}

		static public async Task<bool> RemoveTeamHandout(TeamHandout item)
		{
            DB db = DBConnection.GetContext();

            var dbHandout = (from h in db.TeamHandouts
                             where h.Id == item.Id
                             select h).SingleOrDefault();
            if (dbHandout != null)
            {
                db.TeamHandouts.DeleteOnSubmit(dbHandout);
                db.SubmitChanges();

                await SportsManager.Models.Utils.Storage.Provider.DeleteFile(item.HandoutURL);
                return true;
            }

            return false;
		}
	}
}

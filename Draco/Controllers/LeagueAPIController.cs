using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Linq.Dynamic;

namespace SportsManager.Controllers
{
    public class LeagueAPIController : ApiController
    {
        public class jqGridRow
        {
            public long id;
            public Object[] cell;
        }

        public class jqGridResults
        {
            public int total;
            public int page;
            public int records;
            public IQueryable<jqGridRow> rows;

            public static jqGridResults BuildResults<T>(IQueryable<T> foundItems, int page, int rows, Func<T, jqGridRow> createRow)
            {
                int totalRecords = foundItems.Count();
                int totalPages = (int)Math.Ceiling((float)totalRecords / (float)rows);
                int pageIndex = Convert.ToInt32(page) - 1;
                int pageSize = rows;

                var filteredItems = foundItems.Skip(pageIndex * pageSize).Take(pageSize);
                jqGridResults results = new jqGridResults()
                {
                    total = totalPages,
                    page = page,
                    records = totalRecords,
                    rows = (from f in filteredItems
                            select createRow(f))
                };

                return results;
            }
        }

        [AcceptVerbs("GET"), HttpGet]
        [ActionName("GridData")]
        public jqGridResults Get(long accountId, long id, string sidx, string sord, int page, int rows)
        {
            var foundItems = DataAccess.Leagues.GetLeagues(id);
            if (!foundItems.Any())
                throw new HttpResponseException(HttpStatusCode.NotFound);

            if (String.IsNullOrWhiteSpace(sidx))
                return jqGridResults.BuildResults<ModelObjects.League>(foundItems, page, rows,
                    f => new jqGridRow()
                    {
                        id = f.Id,
                        cell = new Object[1] { f.Name }
                    });
            else
                return jqGridResults.BuildResults<ModelObjects.League>(foundItems.OrderBy(sidx + " " + (sord == "asc" ? "ascending" : "descending")), page, rows,
                    f => new jqGridRow()
                         {
                             id = f.Id,
                             cell = new Object[1] { f.Name }
                         });
        }
    }
}

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SportsManager.Baseball.ViewModels.Controllers
{
    public class LeagueTeamsViewModel : AccountViewModel
    {
        public LeagueTeamsViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
        }

        public IQueryable<LeagueSeason> Leagues
        {
            get
            {
                var seasonId = Controller.GetCurrentSeasonId(AccountId);
                return (from ls in Controller.Db.LeagueSeasons
                        where ls.SeasonId == seasonId
                        select ls);
            }
        }

        public IQueryable<DivisionSeason> Divisions(long leagueId)
        {
            return (from ds in Controller.Db.DivisionSeasons
                    join dd in Controller.Db.DivisionDefs on ds.DivisionId equals dd.Id
                    where ds.LeagueSeasonId == leagueId
                    orderby ds.Priority ascending, dd.Name ascending
                    select ds);
        }

        public IQueryable<TeamSeason> GetDivisionTeams(long divisionId)
        {
            return (from t in Controller.Db.TeamsSeasons
                    where t.DivisionSeasonId == divisionId
                    orderby t.Name ascending
                    select t);
        }

        public FileStream ExportToExcel(long leagueSeasonId, bool onlyManagers)
        {
            Guid guid = Guid.NewGuid();
            var destinationFile = Controller.Server.MapPath("~/Uploads/Temp/" + guid.ToString() + ".xlsx");
            if (onlyManagers)
                File.Copy(Controller.Server.MapPath("~/Content/ManagerAddressListTemplate.xlsx"), destinationFile);
            else
                File.Copy(Controller.Server.MapPath("~/Content/TeamAddressListTemplate.xlsx"), destinationFile);

            // Open the copied template workbook. 
            using (SpreadsheetDocument myWorkbook = SpreadsheetDocument.Open(destinationFile, true))
            {
                // Access the main Workbook part, which contains all references.
                WorkbookPart workbookPart = myWorkbook.WorkbookPart;

                // Get the first worksheet. 
                WorksheetPart worksheetPart = workbookPart.WorksheetParts.First();

                // The SheetData object will contain all the data.
                SheetData sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

                var sheet = workbookPart.Workbook.Descendants<Sheet>().ElementAt(0);
                sheet.Name = AccountName;

                var teamNameRow = worksheetPart.Worksheet.Descendants<Row>().First();
                var teamNameCol = teamNameRow.Descendants<Cell>().First();
                if (onlyManagers)
                    teamNameCol.CellValue = new CellValue(AccountName + " Managers");
                else
                    teamNameCol.CellValue = new CellValue(AccountName);

                teamNameCol.DataType = new EnumValue<CellValues>(CellValues.String);

                long seasonId = Controller.GetCurrentSeasonId(AccountId);

                if (onlyManagers)
                {
                    var leagueTeams = (from ts in Controller.Db.TeamsSeasons
                                       join ls in Controller.Db.LeagueSeasons on ts.LeagueSeasonId equals ls.Id
                                       where ls.SeasonId == seasonId && (leagueSeasonId == 0 || ls.Id == leagueSeasonId)
                                       orderby ls.League.Name, ts.Name
                                       select ts.Id);

                    var allManagers = Controller.Db.TeamSeasonManagers.Where(tsm => leagueTeams.Contains(tsm.TeamSeasonId)).OrderBy(x => x.Contact.LastName).ThenBy(x => x.Contact.FirstName).ThenBy(x => x.Contact.MiddleName);
                    TeamAddressViewModel.ExportManagersToExcel(seasonId, allManagers, sheetData);
                }
                else
                {

                    var allPlayers = (from ls in Controller.Db.LeagueSeasons
                                      join ts in Controller.Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                      join rs in Controller.Db.RosterSeasons on ts.Id equals rs.TeamSeasonId
                                      join r in Controller.Db.Rosters on rs.PlayerId equals r.Id
                                      where ls.SeasonId == seasonId && !rs.Inactive && (leagueSeasonId == 0 || ls.Id == leagueSeasonId)
                                      select rs).GroupBy(x => x.Roster.ContactId).Select(y => y.FirstOrDefault());

                    allPlayers = allPlayers.OrderBy(x => x.Roster.Contact.LastName).ThenBy(x => x.Roster.Contact.FirstName).ThenBy(x => x.Roster.Contact.MiddleName);
                    TeamAddressViewModel.ExportRosterToExcel(seasonId, allPlayers, sheetData);
                }


                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }
    }
}
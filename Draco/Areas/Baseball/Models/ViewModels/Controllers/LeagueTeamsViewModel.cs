using AutoMapper;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ModelObjects;
using SportsManager.Controllers;
using SportsManager.ViewModels;
using SportsManager.ViewModels.API;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
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

        public FileStream ExportToExcel(bool onlyManagers)
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

                IEnumerable<Player> allPlayers;
                if (onlyManagers)
                {
                    List<Player> allManagers = new List<Player>();

                    var leagueTeamManagers = new List<ModelObjects.TeamManager>();

                    //var leagueTeams = DataAccess.Leagues.GetLeagueTeamsFromSeason(AccountId);
                    long currentSeason = Controller.GetCurrentSeasonId(AccountId);

                    var leagueTeams = (from ls in Controller.Db.LeagueSeasons
                                       join ts in Controller.Db.TeamsSeasons on ls.Id equals ts.LeagueSeasonId
                                       where ls.SeasonId == currentSeason
                                       orderby ls.League.Name, ts.Name
                                       select ls);

                    foreach (var lt in leagueTeams)
                    {
                        var tms = DataAccess.Teams.GetTeamManagersAsPlayer(lt.Id).ToList();
                        tms.ForEach(tm => tm.AffiliationDuesPaid = lt.Name);
                        allManagers.AddRange(tms);
                    }

                    allPlayers = allManagers;
                }
                else
                    allPlayers = DataAccess.TeamRoster.GetAllActivePlayers(AccountId).AsEnumerable();

                allPlayers = allPlayers.OrderBy(x => x.Contact.FullName);

                TeamAddressViewModel.ExportRosterToExcel(allPlayers.AsQueryable(), sheetData, onlyManagers);

                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }
    }
}
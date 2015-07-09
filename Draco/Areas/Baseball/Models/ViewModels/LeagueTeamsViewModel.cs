using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using ModelObjects;
using SportsManager.ViewModels;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;

namespace SportsManager.Baseball.ViewModels
{
    public class LeagueTeamsViewModel : AccountViewModel
    {
        public LeagueTeamsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public IEnumerable<League> Leagues
        {
            get
            {
                return DataAccess.Leagues.GetLeagues(DataAccess.Seasons.GetCurrentSeason(AccountId));
            }
        }

        public IQueryable<Division> Divisions(long leagueId)
        {
            return DataAccess.Divisions.GetDivisions(leagueId);
        }

        public IQueryable<Team> GetDivisionTeams(long divisionId)
        {
            return DataAccess.Teams.GetDivisionTeams(divisionId);
        }

        public FileStream ExportToExcel(bool onlyManagers, long leagueSeasonId)
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

                String leagueName = String.Empty;
                if (leagueSeasonId > 0)
                {
                    var league = DataAccess.Leagues.GetLeague(leagueSeasonId);
                    leagueName = " " + league.Name;
                }
                var sheet = workbookPart.Workbook.Descendants<Sheet>().ElementAt(0);
                sheet.Name = AccountName + leagueName;

                var teamNameRow = worksheetPart.Worksheet.Descendants<Row>().First();
                var teamNameCol = teamNameRow.Descendants<Cell>().First();
                if (onlyManagers)
                    teamNameCol.CellValue = new CellValue(sheet.Name + " Managers");
                else
                    teamNameCol.CellValue = new CellValue(sheet.Name);

                teamNameCol.DataType = new EnumValue<CellValues>(CellValues.String);

                IEnumerable<Player> allPlayers;
                if (onlyManagers)
                {
                    List<Player> allManagers = new List<Player>();

                    var leagueTeamManagers = new List<ModelObjects.TeamManager>();

                    IQueryable<Team> leagueTeams;

                    if (leagueSeasonId > 0)
                        leagueTeams = DataAccess.Leagues.GetLeagueTeams(AccountId, leagueSeasonId);
                    else
                        leagueTeams = DataAccess.Leagues.GetLeagueTeamsFromSeason(AccountId);

                    foreach (var lt in leagueTeams)
                    {
                        var tms = DataAccess.Teams.GetTeamManagersAsPlayer(lt.Id).ToList();
                        tms.ForEach(tm => tm.AffiliationDuesPaid = lt.Name);
                        allManagers.AddRange(tms);
                    }

                    allPlayers = allManagers;
                }
                else if (leagueSeasonId > 0)
                {
                    List<Player> leaguePlayers = new List<Player>();

                    var leagueTeams = DataAccess.Leagues.GetLeagueTeams(AccountId, leagueSeasonId);
                    foreach (var lt in leagueTeams)
                    {
                        var tms = DataAccess.TeamRoster.GetPlayers(lt.Id).ToList();
                        leaguePlayers.AddRange(tms);
                    }

                    allPlayers = leaguePlayers;
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
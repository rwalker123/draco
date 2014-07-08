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

        public FileStream ExportToExcel()
        {
            Guid guid = Guid.NewGuid();
            var destinationFile = Controller.Server.MapPath("~/Uploads/Temp/" + guid.ToString() + ".xlsx");
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
                teamNameCol.CellValue = new CellValue(AccountName);
                teamNameCol.DataType = new EnumValue<CellValues>(CellValues.String);

                var allPlayers = DataAccess.TeamRoster.GetAllActivePlayers(AccountId).AsEnumerable();
                allPlayers = allPlayers.OrderBy(x => x.Contact.FullName);

                TeamAddressViewModel.ExportRosterToExcel(allPlayers.AsQueryable(), sheetData);

                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }
    }
}
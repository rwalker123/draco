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

namespace SportsManager.Baseball.ViewModels
{
    public class TeamAddressViewModel : SportsManager.ViewModels.AccountViewModel
    {
        public TeamAddressViewModel(DBController c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = c.Db.TeamsSeasons.Find(teamSeasonId);
            SeasonPlayers = c.Db.RosterSeasons.Where(rs => rs.TeamSeasonId == teamSeasonId);
        }

        public TeamSeason Team { get; private set; }
        public IQueryable<PlayerSeason> SeasonPlayers { get; private set; }

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
                sheet.Name = Team.Name;

                var teamNameRow = worksheetPart.Worksheet.Descendants<Row>().First();
                var teamNameCol = teamNameRow.Descendants<Cell>().First();
                teamNameCol.CellValue = new CellValue(Team.Name);
                teamNameCol.DataType = new EnumValue<CellValues>(CellValues.String);

                ExportRosterToExcel(CurrentSeasonId, SeasonPlayers, sheetData);

                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }

        public static void ExportRosterToExcel(long seasonId, IQueryable<PlayerSeason> roster, SheetData sheetData)
        {
            // Begining Row pointer                       
            int index = 4;

            // For each item in the database, add a Row to SheetData.
            foreach (var player in roster)
            {
                // New Row
                Row row = new Row();
                row.RowIndex = (UInt32)index;

                // New Cell
                CreateCell(row, "A" + index, player.Roster.Contact.FullName);
                CreateCell(row, "B" + index, player.Roster.Contact.Email);

                String affiliationDuesPaid = player.Roster.PlayerSeasonAffiliationDues.Where(psa => psa.SeasonId == seasonId).Select(psa => psa.AffiliationDuesPaid).SingleOrDefault();
                CreateCell(row, "C" + index, player.Roster.Contact.StreetAddress);
                CreateCell(row, "D" + index, player.Roster.Contact.City);
                CreateCell(row, "E" + index, player.Roster.Contact.State);
                CreateCell(row, "F" + index, player.Roster.Contact.Zip);
                CreateCell(row, "G" + index, affiliationDuesPaid);

                // Append Row to SheetData
                sheetData.AppendChild(row);

                // increase row pointer
                index++;

            }
        }

        public static void ExportManagersToExcel(long seasonId, IEnumerable<TeamManager> mgrs, SheetData sheetData)
        {
            // Begining Row pointer                       
            int index = 4;

            // For each item in the database, add a Row to SheetData.
            foreach (var mgr in mgrs)
            {
                // New Row
                Row row = new Row();
                row.RowIndex = (UInt32)index;

                // New Cell
                CreateCell(row, "A" + index, mgr.Contact.FullName);
                CreateCell(row, "B" + index, mgr.Contact.Email);

                CreateCell(row, "C" + index, mgr.Contact.Phone2);
                CreateCell(row, "D" + index, mgr.Contact.Phone3);
                CreateCell(row, "E" + index, mgr.Contact.Phone1);
                CreateCell(row, "F" + index, mgr.Contact.StreetAddress);
                CreateCell(row, "G" + index, mgr.Contact.City);
                CreateCell(row, "H" + index, mgr.Contact.State);
                CreateCell(row, "I" + index, mgr.Contact.Zip);
                CreateCell(row, "J" + index, mgr.TeamsSeason.LeagueSeason.League.Name + " " + mgr.TeamsSeason.Name);

                // Append Row to SheetData
                sheetData.AppendChild(row);

                // increase row pointer
                index++;

            }
        }

        private static void CreateCell(Row row, String column, String cellText)
        {
            Cell cell = new Cell();
            cell.DataType = CellValues.InlineString;
            // Column A1, 2, 3 ... and so on
            cell.CellReference = column;

            // Create Text object
            Text t = new Text();
            t.Text = cellText;

            // Append Text to InlineString object
            InlineString inlineString = new InlineString();
            inlineString.AppendChild(t);

            // Append InlineString to Cell
            cell.AppendChild(inlineString);

            // Append Cell to Row
            row.AppendChild(cell);
        }
    }
}
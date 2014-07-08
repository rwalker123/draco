using ModelObjects;
using SportsManager.ViewModels;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml;
using System;
using System.IO;

namespace SportsManager.Baseball.ViewModels
{
    public class TeamAddressViewModel : AccountViewModel
    {
        public TeamAddressViewModel(Controller c, long accountId, long teamSeasonId)
            : base(c, accountId)
        {
            Team = DataAccess.Teams.GetTeam(teamSeasonId);
            Roster = DataAccess.TeamRoster.GetPlayers(teamSeasonId);
        }

        public Team Team { get; private set; }
        public IQueryable<Player> Roster { get; private set; }

        public Stream ExportToExcel()
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

                ExportRosterToExcel(Roster, sheetData);

                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }

        public static void ExportRosterToExcel(IQueryable<Player> Roster, SheetData sheetData)
        {
            // Begining Row pointer                       
            int index = 4;

                // For each item in the database, add a Row to SheetData.
                foreach (var player in Roster)
                {
                    // New Row
                    Row row = new Row();
                    row.RowIndex = (UInt32)index;

                    // New Cell
                    CreateCell(row, "A" + index, player.Contact.FullName);
                    CreateCell(row, "B" + index, player.Contact.Email);
                    CreateCell(row, "C" + index, player.Contact.StreetAddress);
                    CreateCell(row, "D" + index, player.Contact.City);
                    CreateCell(row, "E" + index, player.Contact.State);
                    CreateCell(row, "F" + index, player.Contact.Zip);
                    CreateCell(row, "G" + index, player.AffiliationDuesPaid);

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
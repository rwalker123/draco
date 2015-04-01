using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using SportsManager.ViewModels;
using System;
using System.IO;
using System.Web.Mvc;
using System.Linq;
using ModelObjects;
using DocumentFormat.OpenXml;

namespace SportsManager.Baseball.ViewModels
{
    public class WorkoutsViewModel : AccountViewModel
    {
        public WorkoutsViewModel(Controller c, long accountId)
            : base(c, accountId)
        {
        }

        public WorkoutsViewModel(Controller c, long accountId, long workoutId)
            : base(c, accountId)
        {
            Workout = DataAccess.Workouts.GetWorkoutAnnouncement(workoutId);
        }

        public WorkoutAnnouncement Workout { get; private set; }

        public FileStream ExportRegistrantsToExcel()
        {
            Guid guid = Guid.NewGuid();
            var destinationFile = Controller.Server.MapPath("~/Uploads/Temp/" + guid.ToString() + ".xlsx");
            File.Copy(Controller.Server.MapPath("~/Content/WorkoutRegistrationListTemplate.xlsx"), destinationFile);

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
                sheet.Name = Workout.Description;

                var nameCell = GetCell(worksheetPart.Worksheet, "A", 1);
                nameCell.CellValue = new CellValue(Workout.Description);
                nameCell.DataType = new EnumValue<CellValues>(CellValues.String);

                var dateCell = GetCell(worksheetPart.Worksheet, "A", 2);
                dateCell.CellValue = new CellValue(Workout.WorkoutDate.ToString());
                dateCell.DataType = new EnumValue<CellValues>(CellValues.String);

                var workoutLocationCell = GetCell(worksheetPart.Worksheet, "B", 2);
                workoutLocationCell.CellValue = new CellValue(Workout.FieldName);
                workoutLocationCell.DataType = new EnumValue<CellValues>(CellValues.String);

                var allRegistrants = DataAccess.WorkoutRegistrants.GetWorkoutRegistrants(Workout.Id);

                ExportRegistrantsToExcel(allRegistrants, sheetData);

                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }

        public static void ExportRegistrantsToExcel(IQueryable<WorkoutRegistrant> registrants, SheetData sheetData)
        {
            // Begining Row pointer                       
            int index = 4;

            // For each item in the database, add a Row to SheetData.
            foreach (var registrant in registrants)
            {
                // New Row
                Row row = new Row();
                row.RowIndex = (UInt32)index;

                // New Cell
                CreateCell(row, "A" + index, registrant.Name);
                CreateCell(row, "B" + index, registrant.Age.ToString());
                CreateCell(row, "C" + index, registrant.WantToManage ? "yes" : "no");
                CreateCell(row, "D" + index, registrant.Email);
                CreateCell(row, "E" + index, PhoneUtils.FormatPhoneNumber(PhoneUtils.UnformatPhoneNumber(registrant.Phone1)));
                CreateCell(row, "F" + index, registrant.Positions);
                CreateCell(row, "G" + index, registrant.WhereHeard);

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

        private static Cell GetCell(Worksheet worksheet, string columnName, uint rowIndex)
        {
            Row row = GetRow(worksheet, rowIndex);

            if (row == null)
                return null;

            return row.Elements<Cell>().Where(c => string.Compare
                   (c.CellReference.Value, columnName +
                   rowIndex, true) == 0).First();
        }


        // Given a worksheet and a row index, return the row.
        private static Row GetRow(Worksheet worksheet, uint rowIndex)
        {
            return worksheet.GetFirstChild<SheetData>().
              Elements<Row>().Where(r => r.RowIndex == rowIndex).First();
        }
    }
}
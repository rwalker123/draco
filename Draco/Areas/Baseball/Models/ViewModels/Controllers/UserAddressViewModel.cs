using ModelObjects;
using SportsManager.ViewModels;
using System.Linq;
using System.Linq.Dynamic;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml;
using System;
using System.IO;
using SportsManager.Controllers;
using SportsManager.ViewModels.API;

namespace SportsManager.Baseball.ViewModels
{
    public class UserAddressViewModel : AccountViewModel
    {
        IQueryable<Contact> m_contacts;

        public UserAddressViewModel(DBController c, long accountId)
            : base(c, accountId)
        {
            m_contacts = c.GetContacts(accountId);
        }

        public FileStream ExportToExcel(String order, String filter)
        {
            Guid guid = Guid.NewGuid();
            var destinationFile = Controller.Server.MapPath("~/Uploads/Temp/" + guid.ToString() + ".xlsx");
            File.Copy(Controller.Server.MapPath("~/Content/UserAddressListTemplate.xlsx"), destinationFile);

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

                string[] filterOps = filter.Split(new char[] { ',' });
                if (filterOps.Length == 3)
                {
                    String filterText = String.Empty;
                    String sortField = "LastName, FirstName";
                    String sortOrder = order;

                    String filterField = filterOps[0];
                    switch(filterOps[0])
                    {
                        case "LastName":
                            filterText = "Last Name";
                            break;
                        case "FirstName":
                            filterText = "First Name";
                            break;
                        case "FirstYear":
                            filterText = "First Year Played";
                            break;
                        case "BirthDate":
                            filterText = "Birth Year";
                            filterField = "DateOfBirth.Year";
                            break;
                        case "Zip":
                            filterText = "Zip Code";
                            break;
                        default:
                            filterField = "";
                            break;
                    }

                    String filterOp = String.Empty;
                    String filterOp2 = String.Empty;
                    switch(filterOps[1])
                    {
                        case "endswith":
                            filterText += " ends with";
                            filterOp = ".EndsWith(";
                            filterOp2 = ")";
                            break;
                        case "startswith":
                            filterText += " starts with";
                            filterOp = ".StartsWith(";
                            filterOp2 = ")";
                            break;
                        case "eq":
                            filterText += " equals";
                            filterOp = "=";
                            break;
                        case "ne":
                            filterText += " not equals";
                            filterOp = "!=";
                            break;
                        case "gt":
                            filterText += " greater than";
                            filterOp = ">";
                            break;
                        case "ge":
                            filterText += " greater or equal";
                            filterOp = ">=";
                            break;
                        case "lt":
                            filterText += " less than";
                            filterOp = "<";
                            break;
                        case "le":
                            filterText += " less or equal";
                            filterOp = "<=";
                            break;
                    }

                    String filterValue = filterOps[2];
                    filterValue = filterValue.Replace('\'', '"');
                    filterText += " " + filterValue;

                    if (!String.IsNullOrEmpty(filterField) && !String.IsNullOrEmpty(filterOp) && !String.IsNullOrEmpty(filterValue))
                    {
                        var filterRow = worksheetPart.Worksheet.Descendants<Row>().First();
                        var filterCol = filterRow.Descendants<Cell>().First();
                        filterCol.CellValue = new CellValue(filterText);
                        filterCol.DataType = new EnumValue<CellValues>(CellValues.String);

                        ExportUsersToExcel(m_contacts.Where(filterField + filterOp + filterValue + filterOp2).OrderBy(sortField + " " + sortOrder), sheetData);
                    }
                }
                
                // save
                worksheetPart.Worksheet.Save();
            }

            return new FileStream(destinationFile, FileMode.Open);
        }

        public static void ExportUsersToExcel(IQueryable<Contact> contacts, SheetData sheetData)
        {
            // Begining Row pointer                       
            int index = 4;

            // For each item in the database, add a Row to SheetData.
            foreach (var contact in contacts)
            {
                // New Row
                Row row = new Row();
                row.RowIndex = (UInt32)index;

                // New Cell
                CreateCell(row, "A" + index, contact.FullName);
                CreateCell(row, "B" + index, contact.Email);
                CreateCell(row, "C" + index, contact.StreetAddress);
                CreateCell(row, "D" + index, contact.City);
                CreateCell(row, "E" + index, contact.State);
                CreateCell(row, "F" + index, contact.Zip);
                CreateCell(row, "G" + index, contact.DateOfBirth.ToShortDateString());
                CreateCell(row, "H" + index, contact.FirstYear.ToString());
                CreateCell(row, "I" + index, contact.Phone3);
                CreateCell(row, "J" + index, contact.Phone2);
                CreateCell(row, "K" + index, contact.Phone1);

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
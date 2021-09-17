
import * as XLSX from "xlsx";

// import * as fs from 'fs';
// Related Stack Overflow: https://stackoverflow.com/questions/34342425/convert-xls-to-csv-on-the-server-in-node


export const XSLtoCSV = (data: Uint8Array) => {
  const workBook = XLSX.read(data, {type: "array"});
  const worksSheetName = workBook.SheetNames[0];
  const workSheet = workBook.Sheets[worksSheetName];

  /* skip the first row */
  const range = XLSX.utils.decode_range(workSheet["!ref"] as string);
  range.s.r = 1; // <-- zero-indexed, so setting to 1 will skip row 0
  workSheet["!ref"] = XLSX.utils.encode_range(range);
  const csvString = XLSX.utils.sheet_to_csv(workSheet);
  return csvString;
};

const XLSProcessor = (fileName: string) => {
  console.log(`XLSProcessor processing: ${fileName}`);
  const workBook = XLSX.readFile(fileName);
  const worksSheetName = workBook.SheetNames[0];
  const workSheet = workBook.Sheets[worksSheetName];
  const outputFileName = fileName.replace(/\.xlsx/i, ".csv");

  /* skip the first row */
  const range = XLSX.utils.decode_range(workSheet["!ref"] as string);
  range.s.r = 1; // <-- zero-indexed, so setting to 1 will skip row 0
  workSheet["!ref"] = XLSX.utils.encode_range(range);
  XLSX.writeFile(workBook, outputFileName, { bookType: "csv"});
  console.log(`   ...→ converted to "${outputFileName}"`);
};

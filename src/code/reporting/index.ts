import { glob } from "glob";
import * as fs from "fs";
import * as path from "path";
import { XSLtoCSV } from "./process-xlsx";
import { ProcessCSVData, SuccessCount, FailCount, ResetCounts } from "./process-sage";

const workingDirectory = path.resolve("./input");

const outputDirectory = path.resolve("./output");
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

const main = async () => {
  console.clear();
  const XlsFileNames = glob.sync(`${workingDirectory}/*.xlsx`);
  const numFiles = XlsFileNames.length;
  console.log(`Importing report ${numFiles} files from ${workingDirectory}`);
  // XlsFileNames.forEach(async (fName, index) => {
  let index = 0;
  for (const fName of XlsFileNames) {
    ResetCounts();
    index++;
    const statusString = `(${index}/${numFiles}) →`;
    console.log(`${statusString} 1: Reading XLSX file: ${fName}`);
    const byteArray = fs.readFileSync(fName);
    const csv = XSLtoCSV(byteArray);
    console.log(`${statusString} 2: Begin processing`);
    const csvWithTopo = await ProcessCSVData(csv);
    console.log(`${statusString} 3: Processing complete: [${SuccessCount}✔|${FailCount}✖]`);
    const foo = fName.split("/").pop();
    const lastPartOfFile = (fName.split("\\").pop() as string).split("/").pop();
    const outPath = `${outputDirectory}/${lastPartOfFile!.replace(/\.xlsx?/i, ".csv")}`;
    console.log(`${statusString} 4: writing CSV output file: → ${outPath}`);
    fs.writeFileSync(outPath, csvWithTopo);
  }
};

main();

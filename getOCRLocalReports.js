const fs = require('fs-extra');
const path = require('path');
const XLSX = require('xlsx');

// Function to get all files recursively from a directory
function getFilesRecursively(directory) {
    const files = [];

    function readDirectory(directory) {
        fs.readdirSync(directory).forEach(file => {
            const fullPath = path.join(directory, file);
            if (fs.lstatSync(fullPath).isDirectory()) {
                readDirectory(fullPath);
            } else {
                files.push(fullPath);
            }
        });
    }

    readDirectory(directory);
    return files;
}

// Function to prepare the report
async function prepareReport(sourceDir, destinationDir) {
    const sourceFiles = getFilesRecursively(sourceDir);
    const destinationFiles = getFilesRecursively(destinationDir);

    const destinationFileMap = new Map();
    destinationFiles.forEach(file => {
        destinationFileMap.set(path.basename(file), file);
    });

    const data = [
        ['FileName', 'SourcePath', 'DestinationPath', 'TextLength', 'Status']
    ];

    sourceFiles.forEach(sourceFile => {
        const fileName = path.basename(sourceFile);
        const destinationFileName = destinationFileMap.get(fileName+".txt");
        const textLength = destinationFileName ? fs.statSync(destinationFileName).size : 0;
        const status = textLength>0 ? 'processed' : 'skipped';

        data.push([fileName, sourceFile, destinationFileName || '', textLength, status]);
    });

    // Creating the worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Writing the workbook to a file
    XLSX.writeFile(workbook, 'ocr-report.xlsx');
}

// Set your source and destination directories here

const sourceDir = '/home/anandan/Downloads/swargapuramAdheenam'
const destinationDir = '/media/anandan/3c065730-66a3-4ff2-a443-573d6d52ba8c/home/anandan/code/translation/downloads/FINAL SWARGAPURAM ADHEENAM DOC_SEGREGATED FOLDER WISE/home/anandan/Downloads/swargapuramAdheenam'

prepareReport(sourceDir, destinationDir).then(() => {
    console.log('Report has been generated successfully.');
}).catch(err => {
    console.error('Error generating report:', err);
});

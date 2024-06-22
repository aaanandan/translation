require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const vision = require('@google-cloud/vision').v1p4beta1;
const mammoth = require('mammoth');
const { PDFImage } = require("pdf-image");
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const officeParser = require('officeparser');
const  EmlParser = require('eml-parser');
const { convert } = require('html-to-text');


const FOLDER_ID_OR_PATH = process.env.FOLDER_ID_OR_PATH;
const IS_LOCAL = process.env.IS_LOCAL === 'true';
const TEMP_FOLDER_PATH = process.env.TEMP_FOLDER_PATH;
const CREDENTIALS_JSON = process.env.CREDENTIALS_JSON;
const RESUME_FILE_PATH = './resume.json'; // Path to store resume data


const SUPPORTED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx','.webp', '.eml','pptx','xlsx'];
// const SUPPORTED_FILE_TYPES = ['.eml'];
const LANGUAGES = ['ta', 'en'];


// Initialize Google Vision client
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: CREDENTIALS_JSON,
});

// Authenticate with Google APIs
async function authenticate() {
    const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_JSON,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/cloud-vision',
        ],
    });
    return await auth.getClient();
}

// Create a folder in the local file system
async function createLocalFolder(folderPath) {
    try {
        await fs.mkdir(folderPath, { recursive: true });
        // console.log(`Created local folder: ${folderPath}`);
    } catch (error) {
        console.error(`Error creating local folder: ${folderPath}`, error);
    }
}

// List files from Google Drive
async function listFilesFromDrive(auth, folderId, parentPath = '') {
    const drive = google.drive({ version: 'v3', auth });
    const files = [];

    async function traverseFolder(folderId, parentPath) {
        const response = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'nextPageToken, files(id, name, mimeType)',
        });

        for (const file of response.data.files) {
            const filePath = path.join(parentPath, file.name);
            if (file.mimeType === 'application/vnd.google-apps.folder') {
                await traverseFolder(file.id, filePath);
            } else {
                files.push({ id: file.id, name: file.name, path: filePath });
            }
        }
    }

    await traverseFolder(folderId, parentPath);
    return files;
}

// Download a file from Google Drive
async function downloadFile(auth, fileId, destinationPath) {
    const driveService = google.drive({ version: 'v3', auth });
    const dest = await fs.open(destinationPath, 'w');

    try {
        const response = await driveService.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        await new Promise((resolve, reject) => {
            const stream = response.data.pipe(dest.createWriteStream());
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`Downloaded file to ${destinationPath}`);
        return true;
    } catch (error) {
        console.error('Error downloading file:', error);
        return false;
    } finally {
        await dest.close();
    }
}

async function extractText(filePath, fileType) {
    try {
        let resultText = '';
        // Define language hints for Tamil and English
        const imageContext = { LANGUAGES };
        imageContext['handwritingLanguageHints'] = LANGUAGES;
        // Check the file type and process accordingly
        if (fileType === '.pdf') {
            resultText = await extractTextFromPdf(filePath, imageContext);
        } else if (fileType === '.doc' || fileType === '.docx') {
            resultText = await extractTextFromWord(filePath, imageContext);
        } else if (fileType === '.eml'){

            resultText = await extractTextFromEml(filePath);
        }else{
            resultText = await extractTextFromImage(filePath, imageContext);
        }

        return resultText;
    } catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error);
        return '';
    }
}

// Function to extract text from images
async function extractTextFromImage(filePath, imageContext) {
    const [result] = await visionClient.textDetection({ image: { content: await fs.readFile(filePath) }, imageContext });
    return result.fullTextAnnotation ? result.fullTextAnnotation.text : '';
}

async function extractImagesFromDocx(filePath) {
    const zip = await mammoth.extractRawText({ path: filePath });
    const doc = new DOMParser().parseFromString(zip.value);
    const imageNodes = xpath.select("//*[local-name()='blip']", doc);
    const imagePaths = [];

    for (const node of imageNodes) {
        const imagePart = node.getAttribute('r:embed');
        if (imagePart) {
            const partPath = path.join(path.dirname(filePath), `word/media/${imagePart}.jpeg`);
            if (await fs.stat(partPath).then(() => true).catch(() => false)) {
                imagePaths.push(partPath);
            }
        }
    }
    return imagePaths;
}

async function extractTextFromDocx(filePath,imageContext) {
    const { value: text } = await mammoth.extractRawText({ path: filePath });
    const images = await extractImagesFromDocx(filePath);
    let ocrText = '';

    for (const imagePath of images) {
        ocrText += await extractTextFromImage(imagePath,imageContext);
    }

    return text + '\n' + ocrText;
}

// Function to extract text from Word documents
async function extractTextFromWord(filePath, imageContext) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.doc') {
        return await officeParser.parseOfficeAsync(filePath);
        // return await officeParser.extract(filePath);
         
    } else if (ext === '.docx') {
        return await extractTextFromDocx(filePath);
    } else {
        throw new Error('Unsupported file type');
    }
}

// Function to extract text from pdf documents
async function extractTextFromPdf(filePath, imageContext) {
    try {
        const pdfImage = new PDFImage(filePath);
        let text = '';

        const numPages = await pdfImage.numberOfPages();
        for (let i = 0; i < numPages; i++) {
            const imagePath = await pdfImage.convertPage(i);
            const [result] = await visionClient.textDetection({ image: { source: { filename: imagePath } }, imageContext });
            text += result.fullTextAnnotation ? result.fullTextAnnotation.text : '';
            fs.unlink(imagePath);
        }

        return text;
    } catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error);
        return '';
    }
}

const fsys = require('fs');
// Function to extract text from an EML file
async function extractTextFromEml(emlFilePath) {
    try {
        const eml = new EmlParser(fsys.createReadStream(emlFilePath));
        const htmlString  = await eml.getEmailAsHtml();
        const options = {
            wordwrap: 130,
          };            
          const text = convert(htmlString, options);
        return text // Trim any leading/trailing whitespace
    } catch (error) {
        console.error('Error extracting text from EML:', error);
        return '';
    }
}
// Load resume data or initialize if not exists
async function loadResumeData() {
    try {
        const data = await fs.readFile(RESUME_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { currentFileIndex: 0 };
    }
}

// Save resume data
async function saveResumeData(data) {
    await fs.writeFile(RESUME_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Create a new Google Sheets document and initialize it
async function createSpreadsheet(auth, title) {
    const sheets = google.sheets({ version: 'v4', auth });
    const resource = {
        properties: {
            title: title,
        },
    };
    const sheet = await sheets.spreadsheets.create({
        resource,
        fields: 'spreadsheetId',
    });
    return sheet.data.spreadsheetId;
}

// Main function to process files
async function processFiles(folderIdOrPath, isLocal = false) {
    const auth = await authenticate();
    const resumeData = await loadResumeData();
    const { currentFileIndex } = resumeData;

    const spreadsheetId = await createSpreadsheet(auth, 'OCR Process Log');
    let filesToProcess = [];
    const rows = [];
    let row;
    let totalFilesProcessed = 0;

    if (isLocal) {
        // Process local folder
        async function traverseLocalFolder(currentPath) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await traverseLocalFolder(fullPath);
                } else {
                    filesToProcess.push({ path: fullPath, name: entry.name });
                }
            }
        }

        await traverseLocalFolder(folderIdOrPath);
    } else {
        // Process Google Drive folder
        filesToProcess = await listFilesFromDrive(auth, folderIdOrPath);
    }

    console.log(`Total files to process: ${filesToProcess.length}`);

    for (let i = currentFileIndex; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const ext = path.extname(file.name).toLowerCase();
        if (!SUPPORTED_FILE_TYPES.includes(ext)) {
            console.log(`Skipping unsupported file type: ${file.name}`);
            row = {
                FileName: file.name,
                SourcePath: file.path,
                DestinationPath: '',
                TextLength: 0,
                Status: 'Skipped - Unsupported file type',
            }
            rows.push(row);
            continue;
        }

        const destFilePath = path.join(TEMP_FOLDER_PATH, file.path.replace(/\.[^/.]+$/, ext+'.txt'));
        await createLocalFolder(path.dirname(destFilePath));

        if (!isLocal) {
            const downloaded = await downloadFile(auth, file.id, destFilePath);
            if (!downloaded) {
                row = {
                    FileName: file.name,
                    SourcePath: file.path,
                    DestinationPath: '',
                    TextLength: 0,
                    Status: 'Error - Download failed',
                }
                rows.push(row);
                continue;
            }
        }

        const extractedText = await extractText(file.path,ext);
        const textLength = extractedText.length;

        await fs.writeFile(destFilePath, extractedText);
        row = {
            FileName: file.name,
            SourcePath: file.path,
            DestinationPath: destFilePath,
            TextLength: textLength,
            Status: 'Processed',
        }
        rows.push(row);
        totalFilesProcessed++;

        // Update resume data after processing each file
        resumeData.currentFileIndex = i + 1;
        await saveResumeData(resumeData);

        console.log(`Processed file: ${file.name} (${totalFilesProcessed}/${filesToProcess.length})`);
    }
    await updateSpreadsheet(auth, spreadsheetId, rows);
    console.log('Processing completed!');
}

// Update Google Sheets
async function updateSpreadsheet(auth, spreadsheetId, rows) {
    const sheetsService = google.sheets({ version: 'v4', auth });
    const values = rows.map(row => [row.FileName, row.SourcePath, row.DestinationPath, row.TextLength, row.Status]);

    await sheetsService.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
            values: [['FileName', 'SourcePath', 'DestinationPath', 'TextLength', 'Status'], ...values]
        }
    });

    // Share the spreadsheet with anyone with the link as viewer
    const drive = google.drive({ version: 'v3', auth });
    await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
            role: 'writer',
            type: 'anyone'
        }
    });

    console.log(`Spreadsheet is now publicly accessible: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}

processFiles(FOLDER_ID_OR_PATH, IS_LOCAL).catch(console.error);

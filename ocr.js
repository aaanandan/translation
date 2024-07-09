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

const fsextra = require('fs-extra');
const XLSX = require('xlsx');

const fsys = require('fs');
const { TranslationServiceClient } = require('@google-cloud/translate').v3;


const FOLDER_ID_OR_PATH = process.env.FOLDER_ID_OR_PATH;
const IS_LOCAL = process.env.IS_LOCAL === 'true';
const TEMP_FOLDER_PATH = process.env.TEMP_FOLDER_PATH;
const CREDENTIALS_JSON = process.env.CREDENTIALS_JSON;
const RESUME_FILE_PATH = './resume.json'; // Path to store resume data
const IS_TRANSLATION = process.env.IS_TRANSLATION === 'true';


// const SUPPORTED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx','.webp', '.eml','.pptx','.xlsx'];
// const SUPPORTED_FILE_TYPES = ['.eml'];
const SUPPORTED_FILE_TYPES = ['.txt','.jpg.txt', '.jpeg.txt', '.png.txt', '.pdf.txt', '.doc.txt', '.docx.txt','.webp.txt', '.eml.txt','.pptx.txt','.xlsx.txt'];
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
async function processFiles(folderIdOrPath, isLocal = false, isTranslation=false) {
    const auth = await authenticate();


    // const spreadsheetId = await createSpreadsheet(auth, 'OCR Process Log');
    let filesToProcess = [];

    if (isLocal) {
        // Process local folder
        async function traverseLocalFolder(currentPath) {
            console.log(currentPath, filesToProcess.length);
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

    // console.log(filesToProcess.length, isLocal,isTranslation);
    await processFileEntries(filesToProcess, isLocal,isTranslation);
    console.log('Processing completed!');
}

async function processFileEntries(filesToProcess,  isLocal, isTranslation=false) {
    let row;
    const rows = [];
    let totalFilesProcessed = 0;
    const resumeData = await loadResumeData();
    const { currentFileIndex } = resumeData;
    const auth = await authenticate();
    totalFilesProcessed = currentFileIndex | 0;
    console.log(`Total files to process: ${filesToProcess.length + currentFileIndex}`);

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
            };
            rows.push(row);
            continue;
        }

        let destFilePath;
        if(isTranslation) destFilePath = path.join(TEMP_FOLDER_PATH, file.path.replace(/\.[^/.]+$/, ext + '_translated_en.txt'));
        else destFilePath = path.join(TEMP_FOLDER_PATH, file.path.replace(/\.[^/.]+$/, ext + '.txt'));
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
                };
                rows.push(row);
                continue;
            }
        }

        
        const processedText = isTranslation ? await  translateFile(file.path):await extractText(file.path, ext);
        const textLength = processedText.length;
        // console.log(isTranslation, processedText);
        await fs.writeFile(destFilePath, processedText);
        row = {
            FileName: file.name,
            SourcePath: file.path,
            DestinationPath: destFilePath,
            TextLength: textLength,
            Status: 'Processed',
        };
        rows.push(row);
        totalFilesProcessed++;

        // Update resume data after processing each file
        resumeData.currentFileIndex = i + 1;
        await saveResumeData(resumeData);

        console.log(`Processed file: ${file.name} (${totalFilesProcessed}/${filesToProcess.length})`,file);
    }

    // await updateSpreadsheet(auth, spreadsheetId, rows);
    // return { row, totalFilesProcessed };
    // fs.writeFile('processlogs.txt',rows);
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

// Set your source and destination directories here
const sourceDir =  FOLDER_ID_OR_PATH; //'/home/anandan/Downloads/swargapuramAdheenam'
const destinationDir = TEMP_FOLDER_PATH ; //'/media/anandan/3c065730-66a3-4ff2-a443-573d6d52ba8c/home/anandan/code/translation/downloads/FINAL SWARGAPURAM ADHEENAM DOC_SEGREGATED FOLDER WISE/home/anandan/Downloads/swargapuramAdheenam'

// Function to get all files recursively from a directory
function getFilesRecursively(directory) {
    const files = [];

    function readDirectory(directory) {
        fsextra.readdirSync(directory).forEach(file => {
            const fullPath = path.join(directory, file);
            if (fsextra.lstatSync(fullPath).isDirectory()) {
                readDirectory(fullPath);
            } else {
                files.push(fullPath);
            }
        });
    }
    readDirectory(directory);
    //console.log(directory,files);
    return files;
}

// Function to prepare the report
async function prepareReport(sourceDir, destinationDir) {
    let filesToProcess = [];
    
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
        const textLength = destinationFileName ? fsextra.statSync(destinationFileName).size : 0;
        const status = textLength>0 ? 'processed' : 'skipped';
        if(status==='skipped'){
            filesToProcess.push({ path: sourceFile, name: fileName});
        }
        data.push([fileName, sourceFile, destinationFileName || '', textLength, status]);
    });

    // Creating the worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    // Writing the workbook to a file
    XLSX.writeFile(workbook, 'ocr-report.xlsx');
    console.log('processsign skipped files');
    // await processFileEntries(filesToProcess, true);
}

processFiles(FOLDER_ID_OR_PATH, IS_LOCAL, IS_TRANSLATION).catch(console.error);
// prepareReport(sourceDir, destinationDir).then(() => {
//     console.log('Report has been generated successfully.');
// }).catch(err => {
//     console.error('Error generating report:', err);
// });

async function translateFile(filePath) {
  try {
    // Read the file content
    const text = fsys.readFileSync(filePath, 'utf8');

    // Authenticate using service account credentials
    const auth = await authenticate();
    // console.log('projectid',auth.projectId);
    const client = new TranslationServiceClient();
    // const  client= new Translate({ projectId: auth.projectId })
    // const detectedLanguage = await detectLanguage(text);
    // console.log(`Detected language: ${detectedLanguage}`);

    const translatedText = await translateToEnglish(text,'ta');
    // console.log(`Translated text (English): ${translatedText}`);
    // // Function to detect language
    // async function detectLanguage(text) {
    //     try {
    //     const [detections] = await client.detectLanguage({
    //         content: text,
    //     });
    //     return detections[0].languages[0].languageCode;
    //     } catch (error) {
            
    //     console.error("Error detecting language:", error);
    //     return "";

    //     // throw error; // Re-throw for handling
    //     }
        
    // }
    // Function to translate to English
    async function translateToEnglish(text,sourceLanguageCode) {
    try {
        // Construct request
        const request = {
            parent: `projects/${auth.projectId}/locations/global`,
            contents: [text],
            mimeType: 'text/plain', // mime types: text/plain, text/html
            sourceLanguageCode: 'ta',
            targetLanguageCode: 'en',
        };

        const [response] = await client.translateText(request);
        
        // console.log('response',response);
        // console.log(`Translation: ${response.translations[0].translatedText}`,i);
        // for (const translation of response.translations) {
            // console.log(`Translation: ${translation.translatedText}`,i);
        //   }

        return response.translations[0].translatedText;
    } catch (error) {
        console.error("Error translating text:", error);
        return "";
        throw error; // Re-throw for handling
    }
    }
    // export GOOGLE_APPLICATION_CREDENTIALS=./creds.json
    

    return translatedText;
} catch (error) {
    console.error("An error occurred:", error);
  }

} 
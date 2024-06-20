const vision = require('@google-cloud/vision');
const fs = require('fs').promises;
const { google } = require('googleapis');
const XLSX = require('xlsx');

// Replace with your downloaded service account key file paths
const visionCredentials = require('./path/to/vision/serviceAccountKey.json');
const driveCredentials = require('./path/to/drive/credentials.json');

// Function to perform OCR on a single image
async function extractText(filePath) {
  const client = new vision.ImageAnnotatorClient({
    credentials: visionCredentials,
  });

  // Read the image content
  const imageContent = await fs.readFile(filePath);

  // Annotate the image for text detection
  const [response] = await client.textDetection(imageContent);
  const fullText = response.fullTextAnnotation.text;

  return fullText;
}

// Function to download a file from Google Drive
async function downloadFileFromDrive(fileId, destinationPath) {
  const drive = google.drive({ version: 'v3', auth: driveCredentials });

  const dest = fs.createWriteStream(destinationPath);

  try {
    await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
      .then((res) => res.data.pipe(dest));
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
}

// Function to upload a file to Google Drive
async function uploadFileToDrive(folderId, filePath, fileName) {
  const drive = google.drive({ version: 'v3', auth: driveCredentials });

  const fileMetadata = {
    'name': fileName,
    'parents': [folderId],
  };

  const media = {
    mimeType: 'text/plain',
    body: fs.createReadStream(filePath),
  };

  try {
    await drive.files.create({
      resource: fileMetadata,
      mediaBody: media,
      fields: 'id',
    });
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    return false;
  }
}

// Function to create a folder in Google Drive (if it doesn't exist)
async function createFolderInDrive(parentId, folderName) {
  const drive = google.drive({ version: 'v3', auth: driveCredentials });

  const fileMetadata = {
    'name': folderName,
    'mimeType': 'application/vnd.google-apps.folder',
    'parents': [parentId],
  };

  try {
    await drive.files.create({ resource: fileMetadata, fields: 'id' });
  } catch (error) {
    // Ignore 'already exists' errors
    if (error.message.includes('already exists')) {
      return;
    }
    console.error('Error creating folder:', error);
  }
}

async function getFilesFromFolder(folderPath) {
    const files = [];
  
    if (folderPath.startsWith('drive/')) {
      const folderId = folderPath.substring(6);
      const drive = google.drive({ version: 'v3', auth: driveCredentials });
  
      async function traverseDriveFolder(pageId) {
        let params = {
          pageSize: 100, // Adjust page size as needed
          q: `'${folderId}' in parents`,
          fields: 'nextPageToken, files(id, name)',
        };
        if (pageId) {
          params.pageToken = pageId;
        }
  
        const response = await drive.files.list(params);
        files.push(...response.data.files.map((file) => ({ path: `drive/${file.id}`, name: file.name })));
  
        if (response.data.nextPageToken) {
          await traverseDriveFolder(response.data.nextPageToken);
        }
      }
  
      await traverseDriveFolder();
    } else {
      const directoryContent = await fs.readdir(folderPath);
      for (const item of directoryContent) {
        const itemPath = `${folderPath}/${item}`; // Corrected path construction
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          const subFiles = await getFilesFromFolder(itemPath); // Recursive call
          files.push(...subFiles);
        } else {
          files.push({ path: itemPath, name: item });
        }
      }
    }
  
    return files;
  }

async function processFolder(folderPath, tempFolderPath, isResume = false) {
    const files = [];
  
    // Check for resume flag and read last processed file (if applicable)
    if (isResume) {
      try {
        const lastProcessedData = await fs.readFile('lastProcessed.txt', 'utf8');
        files.push({ path: lastProcessedData });
      } catch (error) {
        console.log('Error reading last processed file:', error);
      }
    }
  
    // Get all files from the folder (local or Drive)
    files.push(...await getFilesFromFolder(folderPath));
  
    // Logging setup for Excel file
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      { Field: 'File Path', Processed: 'Status', Text: 'Extracted Text' },
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Process Log');
  
    for (const file of files) {
      let processed = 'Pending';
      let extractedText = '';
  
      try {
        // Download file from Drive (if applicable)
        if (file.path.startsWith('drive/')) {
          const downloaded = await downloadFileFromDrive(file.path.substring(6), `${tempFolderPath}/${file.name}`);
          if (!downloaded) {
            throw new Error('Failed to download file');
          }
          file.path = `${tempFolderPath}/${file.name}`; // Update path after download
        }
  
        // Perform OCR on the file
        extractedText = await extractText(file.path);
        processed = 'Success';
  
        // Save extracted text to a new file
        await fs.writeFile(`${tempFolderPath}/ocr_${file.name}`, extractedText);
      } catch (error) {
        console.error('Error processing file:', file.path, error);
        processed = 'Error';
      }
  
      // Update process log worksheet
      XLSX.utils.sheet_add_row(worksheet, [file.path, processed, extractedText]);
  
      // Update last processed file for resume
      await fs.writeFile('lastProcessed.txt', file.path);
    }
  
    // Save the process log Excel file
    XLSX.writeFile(workbook, 'process_log.xlsx');
  
    console.log('Process completed!');
}


processFolder('1sA3NB4TWZ4GUJW3xNi4aOl2Q3yLFqU','downlods')
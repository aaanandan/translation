const fs = require('fs');
const { google } = require('googleapis');

// Load client secrets from a local file.
const serviceAccount = require('./creds.json');

/**
 * Authorize and call the callback function.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
    const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/spreadsheets'
        ],
    });

    callback(auth);
}

/**
 * Recursively lists files in a specific folder.
 * @param {google.auth.GoogleAuth} auth An authorized GoogleAuth client.
 * @param {string} folderId The ID of the folder to list files from.
 * @returns {Promise<Array>} A promise that resolves to an array of files.
 */
async function listFilesRecursively(auth, folderId) {
    const drive = google.drive({ version: 'v3', auth });
    let files = [];
    let foldersToProcess = [folderId];

    while (foldersToProcess.length > 0) {
        const currentFolderId = foldersToProcess.pop();
        let pageToken = null;
        console.log('processing..',currentFolderId, foldersToProcess.length);
        
        do {
            const res = await drive.files.list({
                q: `'${currentFolderId}' in parents`,
                fields: 'nextPageToken, files(id, name, mimeType, parents)',
                spaces: 'drive',
                pageToken: pageToken,
            });
            files = files.concat(res.data.files);
            // console.log(files);
            pageToken = res.data.nextPageToken;
            // Add folders to the list to process
            const folders = res.data.files.filter(file => file.mimeType === 'application/vnd.google-apps.folder').map(file => file.id);
            foldersToProcess = foldersToProcess.concat(folders);
        } while (pageToken);
    }
    return files;
}

/**
 * Lists files in a specific folder and generates a report in Google Sheets.
 * @param {google.auth.GoogleAuth} auth An authorized GoogleAuth client.
 */
async function listFilesAndGenerateReport(auth) {
    const folderId = '1ze0YoOPjqx-ppFaIfiHE-Icv5APJlUla'; 
    const files = await listFilesRecursively(auth, folderId);

    // Count files by type
    const fileTypeCounts = files.reduce((counts, file) => {
        const type = file.mimeType;
        counts[type] = (counts[type] || 0) + 1;
        return counts;
    }, {});

    // Prepare the report data
    const reportData = [
        ['File Type', 'Count'],
        ...Object.entries(fileTypeCounts),
        ['Total', files.length],
    ];

    // Log the report to the console
    console.log('Report Data:');
    console.table(reportData);

    // Create or update the Google Sheets document
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheet = await sheets.spreadsheets.create({
        resource: {
            properties: {
                title: 'Drive File Report'
            },
            sheets: [{
                properties: {
                    title: 'Report'
                },
                data: [{
                    rowData: reportData.map(row => ({
                        values: row.map(cell => ({
                            userEnteredValue: { stringValue: String(cell) }
                        }))
                    }))
                }]
            }]
        }
    });

    console.log(`Report generated: https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit`);

    // Share the spreadsheet with anyone with the link as viewer
    const drive = google.drive({ version: 'v3', auth });
    await drive.permissions.create({
        fileId: spreadsheet.data.spreadsheetId,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    console.log(`Spreadsheet is now publicly accessible: https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit`);
}

// Authorize and run the function
authorize(listFilesAndGenerateReport);
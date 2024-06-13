const fs = require('fs-extra');
const { google } = require('googleapis');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

// Path to your service account key file
const SERVICE_ACCOUNT_FILE = 'credentials.json';

// Load the service account credentials
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

// Create the drive service
const drive = google.drive({ version: 'v3', auth });

async function listFiles(query) {
    let files = [];
    let pageToken = null;

    do {
        const res = await drive.files.list({
            q: query,
            spaces: 'drive',
            fields: 'nextPageToken, files(id, name, mimeType, parents)',
            pageToken: pageToken,
        });

        files = files.concat(res.data.files);
        pageToken = res.data.nextPageToken;
    } while (pageToken);

    return files;
}

async function getFolderPath(folderId) {
    let pathArray = [];
    let folder = folderId;

    while (folder) {
        const res = await drive.files.get({
            fileId: folder,
            fields: 'id, name, parents',
        });

        pathArray.unshift(res.data.name);
        folder = res.data.parents ? res.data.parents[0] : null;
    }

    return pathArray.join('/');
}

async function getImageFiles(folderId = '1pmCESdSdMh7FQV_WRN8mCM-rZwdd9Aui') {
    let imageFiles = [];
    const query = `'${folderId}' in parents and (mimeType contains 'image/')`;

    const files = await listFiles(query);

    for (const file of files) {
        const filePath = await getFolderPath(file.parents[0]);
        imageFiles.push({ path: `${filePath}/${file.name}`, id: file.id });
    }

    // Recursively find image files in subfolders
    const subfolders = await listFiles(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`);
    for (const folder of subfolders) {
        const subfolderFiles = await getImageFiles(folder.id);
        imageFiles = imageFiles.concat(subfolderFiles);
    }

    return imageFiles;
}

async function downloadFile(fileId, destination) {
    const dest = fs.createWriteStream(destination);
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    await new Promise((resolve, reject) => {
        res.data.on('end', () => {
            resolve();
        }).on('error', err => {
            reject(err);
        }).pipe(dest);
    });
}
let imageFiles;
(async () => {
    try {
        imageFiles = await getImageFiles();
        const outputFilePath = 'image_files.txt';

        // Save the list of image files to a text file
        fs.writeFileSync(outputFilePath, imageFiles.map(file => 'downloaded_images/' + file.path).join('\n'), 'utf-8');
        console.log(`Saved list of image files to ${outputFilePath}`);

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            // console.log(i, imageFiles.length, imageFiles, __dirname, 'downloaded_images', file.path);
            const localPath = path.join(__dirname, 'downloaded_images', file.path); // Create nested folder structure
            const dir = path.dirname(localPath);

            // Ensure the directory exists
            await fs.ensureDir(dir);

            // Check if the file already exists
            if (fs.existsSync(localPath)) {
                console.log(`File already exists, skipping ${file.path}`);
                continue;
            }

            // Download the file and save it to the local path
            await downloadFile(file.id, localPath);

            // Print the current progress
            console.log(`Downloaded ${i + 1}/${imageFiles.length}: ${file.path}`);
        }

        // concat images
        // Example usage
        // const imagePaths = ['image1.jpg', 'image2.jpg', 'image3.jpg']; // Replace with your image paths
        const outputPath = 'concatenated_image.jpg'; // Output path
        const direction = 'vertical'; // or 'horizontal'
        imageFiles = imageFiles.map(file => { return '/home/anandan/code/translation/downloaded_images/' + file.path });

        concatenateImages(imageFiles, outputPath, direction);

    } catch (error) {
        console.error('Error:', error);
    }
})();

// concat images
async function createTextImage(text, width) {
    const svgText = `
    <svg width="${width}" height="30">
      <rect width="100%" height="100%" fill="white"/>
      <text x="10" y="20" font-family="Arial" font-size="14" fill="black">${text}</text>
    </svg>`;
    return sharp(Buffer.from(svgText)).png().toBuffer();
}

async function concatenateImages(imagePaths, outputPath, direction = 'vertical') {
    try {
        // Read all images and convert to RGB
        const images = await Promise.all(imagePaths.map(async (imgPath) => {
            const { data, info } = await sharp(imgPath).ensureAlpha().toFormat('png').toBuffer({ resolveWithObject: true });
            return { data, info, path: imgPath };
        }));

        // Determine the output image dimensions
        let width, height;
        if (direction === 'vertical') {
            width = Math.max(...images.map(img => img.info.width));
            height = images.reduce((sum, img) => sum + img.info.height, 0) + (images.length * 60);
        } else if (direction === 'horizontal') {
            width = images.reduce((sum, img) => sum + img.info.width, 0) + (images.length * 60);
            height = Math.max(...images.map(img => img.info.height));
        } else {
            throw new Error("Direction should be 'vertical' or 'horizontal'");
        }

        // Create a blank image
        let outputImage = sharp({
            create: {
                width: width,
                height: height,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        });

        // Composite the images and text onto the blank image
        let offset = 0;
        const composites = [];

        for (const img of images) {
            const filename = path.basename(img.path);
            const markerText = `Filename: ${filename}, Path: ${img.path}`;
            const endMarkerText = 'End of image';

            const textImage = await createTextImage(markerText, width);
            const endTextImage = await createTextImage(endMarkerText, width);

            if (direction === 'vertical') {
                composites.push({ input: textImage, top: offset, left: 0 });
                composites.push({ input: img.data, top: offset + 30, left: 0 });
                composites.push({ input: endTextImage, top: offset + 30 + img.info.height, left: 0 });
                offset += img.info.height + 60;
            } else if (direction === 'horizontal') {
                composites.push({ input: textImage, top: 0, left: offset });
                composites.push({ input: img.data, top: 30, left: offset });
                composites.push({ input: endTextImage, top: 30 + img.info.height, left: offset });
                offset += img.info.width + 60;
            }
        }

        // Composite all parts together
        outputImage = outputImage.composite(composites);

        // Save the output image
        await outputImage.toFile(outputPath);
        console.log('Concatenated image saved to', outputPath);
    } catch (error) {
        console.error('Error concatenating images:', error);
    }
}


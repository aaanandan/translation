const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createTextImage(text, width, height) {
    const svgText = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <text x="10" y="20" font-family="Arial" font-size="14" fill="black">${text}</text>
    </svg>`;
    return sharp(Buffer.from(svgText)).png().toBuffer();
}

async function concatenateImages(imagePaths, outputPath, direction = 'vertical') {
    try {
        // Read all images
        const images = await Promise.all(imagePaths.map(async (imgPath) => {
            const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
            return { data, info, path: imgPath };
        }));

        // Determine the output image dimensions
        let width, height;
        if (direction === 'vertical') {
            width = Math.max(...images.map(img => img.info.width));
            height = images.reduce((sum, img) => sum + img.info.height, 0) + (images.length * 40);
        } else if (direction === 'horizontal') {
            width = images.reduce((sum, img) => sum + img.info.width, 0) + (images.length * 40);
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
        }).png();

        // Composite the images and text onto the blank image
        let offset = 0;
        for (const img of images) {
            const filename = path.basename(img.path);
            const markerText = `Filename: ${filename}, Path: ${img.path}`;
            const endMarkerText = 'End of image';

            const textImage = await createTextImage(markerText, width, 30);
            const endTextImage = await createTextImage(endMarkerText, width, 30);

            if (direction === 'vertical') {
                outputImage = outputImage
                    .composite([{ input: textImage, top: offset, left: 0 }])
                    .composite([{ input: img.data, raw: img.info, top: offset + 30, left: 0 }])
                    .composite([{ input: endTextImage, top: offset + 30 + img.info.height, left: 0 }]);
                offset += img.info.height + 60;
            } else if (direction === 'horizontal') {
                outputImage = outputImage
                    .composite([{ input: textImage, top: 0, left: offset }])
                    .composite([{ input: img.data, raw: img.info, top: 30, left: offset }])
                    .composite([{ input: endTextImage, top: 30 + img.info.height, left: offset }]);
                offset += img.info.width + 30;
            }
        }

        // Save the output image
        await outputImage.toFile(outputPath);
        console.log('Concatenated image saved to', outputPath);
    } catch (error) {
        console.error('Error concatenating images:', error);
    }
}

// Example usage
const imagePaths = ['image1.jpg', 'image2.jpg', 'image3.jpg']; // Replace with your image paths
const outputPath = 'concatenated_image.jpg'; // Output path
const direction = 'vertical'; // or 'horizontal'
concatenateImages(imagePaths, outputPath, direction);

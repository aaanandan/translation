const robot = require('robotjs');
const fs = require('fs-extra');
const path = require('path');

// Folder containing files to be dragged and dropped
const folderPath = '/home/anandan/Desktop/1989 communication letters-20240610T192521Z-001/1989 communication letters';  // Replace with your folder path

// Time interval between actions (in milliseconds)
const timeInterval = 5000;

// Coordinates of the starting point for drag-and-drop (customize as needed)
const startX = 180;
const startY = 251;

// Coordinates of the drop point in the browser window (customize as needed)
const dropX = 500;
const dropY = 500;

// Function to simulate drag and drop
async function dragAndDropFile(filePath) {
    console.log(`Dragging and dropping file: ${filePath}`);
    
    // Simulate mouse movements
    // Move to the file location (start point)
    robot.moveMouse(startX, startY);
    robot.mouseClick();


    // Press and hold the left mouse button
    robot.mouseToggle('down');

    // Move to the drop point
    robot.dragMouse(dropX, dropY);

    // Release the left mouse button
    robot.mouseToggle('up');

    console.log(`File dropped: ${filePath}`);
}

// Main function to process files
async function processFiles() {
    try {
        const files = await fs.readdir(folderPath);

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            
            // Drag and drop the file
            await dragAndDropFile(filePath);

            // Wait for the specified time interval
            await new Promise(resolve => setTimeout(resolve, timeInterval));
        }

        console.log('All files have been processed.');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Start processing files
processFiles();

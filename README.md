to run OCR or tranlation 

update .env to set source abnd destination folder
set isLocal to true - you need to download the soce image,pdf files from drive
set IS_TRANSLATION to true  if this translation of text from tam to english, false for OCR
set FOLDER_ID_OR_PATH source and TEMP_FOLDER_PATH - destionation folders

>>node ocr.js

you can run OCR by commenting below Lines 
processFiles(FOLDER_ID_OR_PATH, IS_LOCAL, IS_TRANSLATION).catch(console.error);
//prepareReport(sourceDir, destinationDir).then(() => {
//     console.log('Report has been generated successfully.');
//}).catch(err => {
//    console.error('Error generating report:', err);
//})

>>node ocr.js
you can generate XL report for OCR after ocr completion, by uncommenting below Lines near 450
// processFiles(FOLDER_ID_OR_PATH, IS_LOCAL, IS_TRANSLATION).catch(console.error);
prepareReport(sourceDir, destinationDir).then(() => {
     console.log('Report has been generated successfully.');
}).catch(err => {
    console.error('Error generating report:', err);
});

;



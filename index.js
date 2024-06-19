const fs = require('fs');
let entries;
fs.readFile("C:/Users/anand/Downloads/1.har", function (err, data) {
    // Check for errors 
    if (err) throw err;

    // Converting to JSON 
    entries = JSON.parse(data);
    console.log('entries', entries);

    function allNodes(obj, key, array) {
        array = array || [];
        if ('object' === typeof obj) {
            for (let k in obj) {
                if (k === key) {
                    array.push(obj[k]);
                } else {
                    allNodes(obj[k], key, array);
                }
            }
        }
        return array;
    }

    let result = allNodes(entries, "text");
    console.log(result);
    result[1] = result[2] = result[0] = '';
    result = result.filter(e => !e.startsWith('{\"prompt'));
    console.log(result);

    const translation = 'translation';
    const transcription = 'transcription';

    if (!fs.existsSync(translation)) {
        fs.mkdirSync(translation, { recursive: true });
        console.log('creating folder ', translation);
    }
    if (!fs.existsSync(transcription)) {
        fs.mkdirSync(transcription, { recursive: true });
        console.log('creating folder', transcription);
    }
    result = result.map((e, index) => {
        let filename;
        if (e.startsWith("------WebKitFormBoundary")) {
            filename = e.split("filename=\"")[1].split("\"\r\nContent-Type:")[0];
            console.log('FileName:', filename, "\n Tamil", result[index + 1], "\n English", result[index + 2]);
            console.log('*****************************************************************************');
            fs.writeFileSync(transcription + "/" + filename + "_transcription.txt", result[index + 1]);
            fs.writeFileSync(translation + "/" + filename + "_translation.txt", result[index + 2]);
        }
    });
});
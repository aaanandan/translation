// First fetch request
fetch("https://api.openl.io/translate/img", {
    "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "cache-control": "no-cache",
        "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryQSli5zf7GEBAiwuj",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Linux\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://openl.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "------WebKitFormBoundaryQSli5zf7GEBAiwuj\r\nContent-Disposition: form-data; name=\"file\"; filename=\"2018_09_28_15_11_43_021.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n\r\n------WebKitFormBoundaryQSli5zf7GEBAiwuj\r\nContent-Disposition: form-data; name=\"role\"\r\n\r\nstarter\r\n------WebKitFormBoundaryQSli5zf7GEBAiwuj--\r\n",
    "method": "POST"
}).then(response => response.json())
    .then(data => {
        console.log('First fetch response:', data);
        // Second fetch request
        return fetch("https://api.openl.io/translate/img", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://openl.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "OPTIONS"
        });
    }).then(response => response.json())
    .then(data => {
        console.log('Second fetch response:', data);
        // Third fetch request
        return fetch("data:image/jpeg;base64,PLACEHOLDER_BASE64_IMAGE", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://openl.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "OPTIONS"
        });
    }).then(response => response.json())
    .then(data => {
        console.log('Third fetch response (with placeholder base64):', data);
        // Fourth fetch request
        return fetch("https://api.openl.io/translate/img", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://openl.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "OPTIONS"
        });
    }).then(response => response.json())
    .then(data => {
        console.log('Fourth fetch response:', data);
        // Fifth fetch request
        return fetch("https://api.openl.io/translate/img", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "Referer": "https://openl.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "OPTIONS"
        });
    }).then(response => response.json())
    .then(data => {
        console.log('Fifth fetch response:', data);
    }).catch(error => {
        console.error('Error:', error);
    });

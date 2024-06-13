const imageToBase64 = require('image-to-base64');


async function gettranslation() {


    let response1 = await fetch("https://api.openl.io/translate/img", {
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
    });
    console.log(response1);
    let response2 = await fetch("https://api.openl.io/translate/img", {
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
    console.log(response2);


    // let imageData = await imageToBase64("/home/anandan/code/translation/downloaded_images/docs/2.7.74 HRNC  letter to Nagapattnam  Aaheenam related issue not to chant sankalpa in tamil.jpeg") // Path to the image
    // let response3 = await fetch(imageData, {
    //     "referrer": "",
    //     "referrerPolicy": "strict-origin-when-cross-origin",
    //     "body": null,
    //     "method": "GET"
    // });


    // console.log(response3);

    let response4 = await fetch("https://api.openl.io/translate/v2", {
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

    console.log(response4);
    let response5 = await
        fetch("https://api.openl.io/translate/v2", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-IN,en;q=0.9,ta-IN;q=0.8,ta;q=0.7,en-GB;q=0.6,en-US;q=0.5",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "nonce": "0.23467650223252368",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "secret": "IEODE9aBhM",
                "signature": "3c2f61dce48f49ce88b9001f0d6a4100",
                "timestamp": "1718077237369",
                "Referer": "https://openl.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": "{\"prompt\":{\"type\":1,\"tone\":\"\",\"writer\":\"\",\"targetLang\":\"English\",\"text\":\"திருச்சிற்றம்பலம்\\nதிருநாவுக்கரசர் திருநாள் அழைப்பு\\n“திருநாவுக்கரசு எனுமோர் சொற்றான் எழுதியும்\\nசொல்லியுமே என்றும் துன்பில் பதம் பெற்றான் ஒருநம்பி அப்பூதி\\nஎன்னும் பெருந்தகையே''\\nஅருள்நெறியன்பரீர்!\\nவணக்கம். வழக்கம் போல் திருக்கழுக்குன்றம் நால்வர் திருக்\\nகோயிலில், அப்பர் தொண்டர் அணியினரின் ஆதரவுடன்\\nதிருநாவுக்கரசர் (அப்பர் பெருமான்) திருநாள் கீழ்க்கண்டபடி\\nநடைபெறும் தாங்கள் தமருடன் வந்து விழாவில் ஈடுபட்டுச்\\nசிறப்பித்துத் திருவருளைப் பெறுமாறு வேண்டுகின்றேன்.\\nபணிவுள்ள,\\nந.ரா. ஆடலரசு\\n(விழாச் செயலர்)\\nநிகழ்ச்சி நிரல்\\nகுருகுலம்,\\nஅடிகள்\\n29-4-89 சனிக்கிழமை மாலை 6 மணியளவில்\\nதிருக்குறள் பீடம் சிவத்திரு : குருபழநி\\nமுன்னிலையில் விழா நிகழ்ச்சிகள் தொடங்கும்.\\nஅருள்நெறித் தொண்டர். திரு.எம். கிருட்டிணன்\\nஐ.ஏ.எஸ்., (ஓய்வு) அவர்கள் தலைமையில் ஆறாம்\\nதிருமுறை முற்றோதல் இரவு 9.00 மணி வரை நடை\\nபெறும்.\\n30-4-89 ஞாயிறு காலை 5 மணி : சிவபூசைத் திருக்காட்சி-\\nதொடர்ந்து சமய குரவர்களுக்குச் சிறப்புத் திருமுழுக்கு\\nதூப தீபாராதனை. காலை 9.00 மணியளவில்\\nவலமாகத் திருநாவுக்கரசர் திருவுலா ஆறாந் திருமுறை\\nமுற்றோதல் குழுவும் பின்தொடரும்.\\nமலை\\nமாலை 4.00 மணியளவில் அப்பர் தொண்டர் அணி\\nபொதுக்குழுக் கூட்டமும் அருள்நெறியன்பர்கள்\\nகூட்டமும் நால்வர் கோயில் திருமுன் நடைபெறும்.\\nஅப்பர் தொண்டர் அணியின் ஆண்டு அறிக்கை படித்தல்\\n- செயலர்,ந.நித்தியானந்தம் பி.ஏ.பி.டி.,\\n6மணி அளவில் பெரும்புலவர். காசி. தனக்கோட்டி அடிகள்\\nஎம்.ஏ., அவர்கள் தலைமையில் மயிலம் சி.பா.சு. தமிழ்க்\\nகல்லூரிப் பேராசிரியர் சு. டாக்டர். திருநாவுக்கரசு அவர்\\nகளின் சொற்பொழிவு.\\n''அப்பர் பெருமானின் அருளுரைகள்\\\" குருகுலம் அடிகளின்\\nவாழ்த்துரையும் விழாச் செயலரின் நன்றியுரையும்.\\nடைவெளிக்குப் பின் இரவு 9.0) மணியளவில் தேவார\\nஇசைத்தென்றல் குடந்தை இலட்சுமணன் குழுவினரின்\\nதேவார இன்னிசை.\\nஇரவு 11.30 மணியளவில் விழா நிறைவும் - வாழ்த்தும்.\",\"industry\":\"legal\",\"format\":\"\",\"summarizeType\":\"paragraph\",\"url\":\"\",\"translateType\":\"img\"},\"role\":\"starter\",\"license_key\":\"D13BFC9E-623F-4F72-B3B4-23622EF1757B\"}",
            "method": "POST"
        });

    console.log(response5);
}


gettranslation();
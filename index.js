const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const AdmZip = require("adm-zip");
const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.static("./uploads"));

app.get("/", (req, res) => {
    return res.json({ message: "Hello world 🔥🇵🇹" });
});

async function createZipArchive() {
    try {
        const zip = new AdmZip();
        const outputFile = `./zipFolder/test-${new Date().toISOString()}.zip`;
        zip.addLocalFolder("./uploads");
        zip.writeZip(outputFile);
        console.log(`Created ${outputFile} successfully`);
    } catch (e) {
        console.log(`Something went wrong. ${e}`);
    }
}

// async function compositeImages(image) {
//     try {
//         await sharp(image)
//             .composite([
//                 {
//                     input: "./design/image.webp",
//                     top: 50,
//                     left: 50,
//                 },
//             ])
//             .toFile(image);
//     } catch (error) {
//         console.log(error);
//     }
// }

app.post("/", upload.single("picture"), async (req, res) => {
    fs.access("./uploads", (error) => {
        if (error) {
            fs.mkdirSync("./uploads");
        }
    });
    const { buffer, originalname } = req.file;
    const timestamp = new Date().toISOString();
    const ref = `${timestamp}-${originalname}`;
    await sharp(buffer)
        .jpeg({ quality: 20 }).composite([
            {
                input: "./design/image.webp",
                top: 50,
                left: 50,
                gravity: 'southeast'
            },
        ]).withMetadata(buffer, {
            clear: true, //remove old metadata
            tEXt: {
                Title: "Short (one line) title or caption for image",
                Author: "Name of image's creator",
                Description: "Description of image (possibly long)",
                Copyright: "Copyright notice",
                Software: "Software used to create the image",
                Disclaimer: "Legal disclaimer",
                Warning: "Warning of nature of content",
                Source: "Device used to create the image",
                Comment: "Miscellaneous comment"
            }
        }).flatten({ background: '#ff6600' })
        .toFile("./uploads/" + ref).then(info => {
            createZipArchive()
        });
    const link = `http://localhost:5001/${ref}`; ``
    return res.json({ link });
});

app.listen(5001);
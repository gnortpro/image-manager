const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const AdmZip = require("adm-zip");
const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadDir = "./uploads";

app.use(express.static(uploadDir));

app.get("/", (req, res) => {
    return res.json({ message: "Hello world 🔥🇵🇹" });
});

async function createZipArchive() {
    try {
        const zip = new AdmZip();
        const outputFile = `./zipFolder/test-${new Date().toISOString()}.zip`;
        zip.addLocalFolder(uploadDir);
        zip.writeZip(outputFile);

        fs.readdirSync(uploadDir).forEach(f => fs.rmSync(`${uploadDir}/${f}`));

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
    fs.access(uploadDir, (error) => {
        if (error) {
            fs.mkdirSync(uploadDir);
        }
    });
    const { buffer, originalname } = req.file;
    const timestamp = new Date().toISOString();
    const ref = `${timestamp}-${originalname}`;

    await sharp(buffer).withMetadata({
        exif: {
            IFD0: {
                Artist: 'Trong',
                Copyright: '@2022 Trong',
                Rating: '5',
                RatingPercent: '99',
                Copyright: '@2022 Trong',
            }
        }
    }).jpeg({ quality: 20 }).composite([
        {
            input: "./design/image.webp",
            top: 50,
            left: 50,
            gravity: 'southeast'
        },
    ]).flatten({ background: '#ff6600' })
        .toFile("./uploads/" + ref).then(info => {
            createZipArchive()
        });
    const link = `http://localhost:5001/${ref}`; ``
    return res.json({ link });
});

app.listen(5001);
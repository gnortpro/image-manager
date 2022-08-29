const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const AdmZip = require("adm-zip");
const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const videoshow = require('videoshow');
const axios = require('axios');
const cors = require('cors')
const bodyParser = require("body-parser");

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const uploadDir = "./uploads";

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(uploadDir));

app.get("/", (req, res) => {
    return res.json({ message: "Hello world 🔥🇵🇹" });
});

async function onMakeVideo() {
    try {

        const videoOptions = {
            fps: 25,
            loop: 5, // seconds 
            transition: true,
            transitionDuration: 1, // seconds 
            videoBitrate: 1024,
            videoCodec: 'libx264',
            size: '640x?',
            audioBitrate: '128k',
            audioChannels: 2,
            format: 'mp4',
            pixelFormat: 'yuv420p'
        }

        var filesListInUploadFolder = [];

        await fs.readdirSync(uploadDir).forEach(f => filesListInUploadFolder.push(`${uploadDir}/${f}`));

        console.log('filesListInUploadFolder', filesListInUploadFolder);

        if (filesListInUploadFolder.length) {
            videoshow(filesListInUploadFolder, videoOptions)
                // .audio('song.mp3')
                .save(`./video/video-${new Date().toISOString()}.mp4`)
                .on('start', function (command) {
                    console.log('ffmpeg process started:', command)
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err)
                    console.error('ffmpeg stderr:', stderr)
                })
                .on('end', function (output) {
                    console.error('Video created in:', output)
                    fs.readdirSync(uploadDir).forEach(f => fs.unlinkSync(`${uploadDir}/${f}`));

                })
        }
    } catch (err) {
        console.log('error:', err);
    }


}

async function createZipArchive() {
    try {
        const zip = new AdmZip();
        const outputFile = `./zipFolder/test-${new Date().toISOString()}.zip`;
        zip.addLocalFolder(uploadDir);
        zip.writeZip(outputFile);

        console.log(`Created ${outputFile} successfully`);
    } catch (e) {
        console.log(`Something went wrong. ${e}`);
    }
}

app.post("/", upload.array("picture"), async (req, res) => {
    await req.files.map((image, index) => {
        const { buffer, originalname } = image;
        const timestamp = new Date().toISOString();
        const ref = `${timestamp}-${originalname}`;


        sharp(buffer).resize(500, 500).withMetadata({
            exif: {
                IFD0: {
                    Artist: 'Trong',
                    Copyright: '@2022 Trong',
                    Rating: '5',
                    RatingPercent: '99',
                    Copyright: '@2022 Trong',
                }
            }
        }).jpeg({ quality: 80 }).composite([
            {
                input: "./design/image.webp",
                top: 50,
                left: 50,
                gravity: 'southeast'
            },
        ]).flatten({ background: '#ff6600' })
            .toFile("./uploads/" + ref).then(() => {
                if (index === req.files.length - 1) {
                    createZipArchive()
                    onMakeVideo()
                }
            });
    });

    // const link = `http://localhost:5001/${ref}`;
    return res.json({ links: true });
});

const WooApi = new WooCommerceRestApi({
    url: "http://localhost:10003",
    consumerKey: "ck_0187a8c9963dc5ac6a5d565592e7bac0c30398fb",
    consumerSecret: "cs_7298549cf99d0119647b7caf8a9e5e11b5a8d427",
    version: "wc/v3"
});

app.get("/orders", (req, res, next) => {
    WooApi.get('orders').then(response => {
        res.send(response.data)
    })

})

app.post('/switch-store', (req, res) => {
    console.log('req', req.body);
    res.send('POST request to the homepage')
})


app.listen(5001);
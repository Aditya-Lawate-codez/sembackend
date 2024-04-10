require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const ytdl = require('ytdl-core');
const { pipeline } = require('stream');
const path = require('path');
const stt = require('stream');
const app = express();
const PORT = 4200;
// npm install google-translate-api-x
const { translate } = require('google-translate-api-x');
const { createClient } = require("@deepgram/sdk");
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes
// var transcriptionResult;
const { YoutubeTranscript } = require('youtube-transcript');
var script = '';

const multer = require('multer');
// Set up multer for handling file uploads
// const upload = multer({ dest: 'uploads/' });


app.post('/store', async (req, res) => {
    const { link, save } = req.body;
    // Here, you can store the link in a text file or a database
    fs.appendFile('youtube_links.txt', link + '\n', async (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Error storing YouTube link' });
        } else {
            console.log('YouTube link stored successfully');
            try {
                const transcriptionResult = await downloadAudio(link, save);
                res.json({ message: 'YouTube link stored successfully', transcription: transcriptionResult });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error downloading audio from YouTube' });
            }
        }
    });
});
const ffmpeg = require('fluent-ffmpeg')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).single('video');

app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // File uploaded successfully
        const videoPath = req.file.path;
        const mp3Path = `${videoPath}.mp3`;
        ffmpeg(videoPath)
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('Error converting file to MP3:', err);
                return res.status(500).json({ error: 'Error converting file to MP3' });
            })
            .on('end', () => {
                console.log('File converted to MP3 successfully');
                fs.renameSync(mp3Path, videoPath);
                transcribeFile(videoPath, "true");
                return res.status(200).send('File uploaded and converted to MP3 successfully');
            })
            .saveToFile(mp3Path);
    });
});


app.post('/translate',
    async (req, res) => {
        const { text, lang } = req.body;
        try {
            const transText = await translate(text, { to: lang });
            res.json({ TextTrans: transText.text });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ TextTrans: 'Error translating audio' });
        }
    }
)

async function downloadAudio(link, save) {
    const videoInfo = await ytdl.getInfo(link);
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, 'audio');
    if (!audioFormat) {
        throw new Error('No audio format found for the provided YouTube video');
    }
    // pathToFile = `audio.mp3`
    const audioOutputPath = path.resolve(__dirname, '.', `audio.mp3`);
    const audioStream = ytdl.downloadFromInfo(videoInfo, { quality: "highestaudio" });

    await new Promise((resolve, reject) => {
        pipeline(
            audioStream,
            fs.createWriteStream(audioOutputPath),
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });

    return transcribeFile('audio.mp3', save);
}

async function transcribeFile(pathtofile, save) {
    console.log("started trans");
    const deepgramApiKey = process.env.Deep_API;
    const pathToFile = pathtofile;
    const deepgram = createClient(deepgramApiKey);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        fs.readFileSync(pathToFile),
        {
            model: "nova-2",
            detect_language: true,
            summarize: "v2",
            smart_format: true,
        },
    );

    if (error) {
        throw error;
    }
    // result.results.channels[0].alternatives[0].paragraphs.paragraphs.forEach(paragraph=>{
    //     paragraph.sentences.forEach(sentence=>{
    //         script += sentence.text +' ';

    //     });
    // })
    console.log(save)
    if (save === "true") {
        var jsonResponse = result.results.channels[0].alternatives[0].paragraphs;
        const transcriptData = {
            transcript: jsonResponse.paragraphs.transcript,
            paragraphs: jsonResponse.paragraphs.map(paragraph => ({
                text: paragraph.sentences.map(sentence => sentence.text).join(' '),
                start: paragraph.start,
                end: paragraph.end
            }))
        };
        // Convert data to JSON
        console.log("file save kr raha hu bro")
        const transcriptJSON = JSON.stringify(transcriptData, null, 2);
        fs.writeFile('transcript.json', transcriptJSON, 'utf8', (err) => {
            if (err) {
                console.error('Error writing transcript file:', err);
            } else {
                console.log('Transcript file saved successfully.');
            }

        });
    }
    return result.results.summary.short;
}

app.get(
    '/transcriptFile',
    (req, res) => {
        const filePath = "transcript.json";
        if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
        res.setHeader('Content-Disposition', 'attachment; filename=transcript.json');
        res.setHeader('Content-Type', 'application/json');
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    });




app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
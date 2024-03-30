require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ytdl = require('ytdl-core');
const AWS = require('aws-sdk');
const { createClient } = require("@deepgram/sdk");

const app = express();
const PORT = 4200;

// Configure AWS SDK with your credentials and region
AWS.config.update({ accessKeyId: 'YOUR_ACCESS_KEY_ID', secretAccessKey: 'YOUR_SECRET_ACCESS_KEY', region: 'YOUR_REGION' });
const s3 = new AWS.S3();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

app.post('/store', async (req, res) => {
    const { link } = req.body;
    try {
        const s3Url = await saveYoutubeAudioToS3(link);
        const transcription = await transcribeAndSummarize(s3Url);
        res.json({ message: 'YouTube audio transcribed and summarized successfully', transcription: transcription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing audio' });
    }
});

async function saveYoutubeAudioToS3(youtubeUrl) {
    try {
        // Get readable stream from YouTube video
        const audioStream = ytdl(youtubeUrl, { quality: 'highestaudio' });

        const uploadParams = { Bucket: 'YOUR_S3_BUCKET_NAME', Key: 'audio.mp3', Body: audioStream };
        const data = await s3.upload(uploadParams).promise();

        return data.Location;
    } catch (error) {
        console.error('Error saving audio to S3:', error);
        throw error;
    }
}

async function transcribeAndSummarize(audioUrl) {
    try {
        const deepgramApiKey = process.env.Deep_API;
        const deepgram = createClient(deepgramApiKey);
        const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
            audioUrl,
            {
                model: "nova-2",
                detect_language: true,
                summarize: "v3",
                smart_format: true,
                diarize: true,
            },
        );

        if (error) {
            throw error;
        }
        return result.results.summary.short;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

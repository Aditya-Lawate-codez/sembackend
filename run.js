// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());

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
                if (req.body.save && req.body.save === 'true') {
                    fs.renameSync(mp3Path, videoPath); 
                    transcribeFile(videoPath, "true");
                } else {
                    // Delete MP3 file if not needed
                    fs.unlinkSync(mp3Path);
                    transcribeFile(videoPath, "false");
                }
                return res.status(200).send('File uploaded and converted to MP3 successfully');
            })
            .saveToFile(mp3Path);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// node 
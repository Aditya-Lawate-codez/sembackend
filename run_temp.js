const ffmpeg = require('fluent-ffmpeg');

// Input MP4 file path
const inputFilePath = 'audio.mp3';
// Output MP3 file path
const outputFilePath = 'output.mp3';

ffmpeg(inputFilePath)
  .toFormat('mp3')
  .save(outputFilePath)
  .on('end', () => {
    console.log('Conversion complete!');
  })
  .on('error', (err) => {
    console.error('Error converting file:', err);
  });
// const { YoutubeTranscript } = require('youtube-transcript');
// var yt = true;
// // if (YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=1BTxxJr8awQ')){
// //   yt= (true)
// //   console.log()

// // }
// function runThis() {
//   console.log('Running');
// }
// const setYT=()=>{
//   yt=false
// }


// YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=1BTxxJr8awQ').then(console.error).catch((error)=>setYT()).finally(runThis())
// console.log(yt)
// npm install whisper-node
// const whisper = require('whisper-node');

// const filePath = "audio.mp3"; // required

// const options = {
//   modelName: "base.en",       // default
//   // modelPath: "/custom/path/to/model.bin", // use model in a custom directory (cannot use along with 'modelName')
//   whisperOptions: {
//     language: 'auto',      // default (use 'auto' for auto detect)
//     gen_file_txt: false,      // outputs .txt file
//     gen_file_subtitle: false, // outputs .srt file
//     gen_file_vtt: false,      // outputs .vtt file
//     word_timestamps: true     // timestamp for every word
//     // timestamp_size: 0      // cannot use along with word_timestamps:true
//   }
// }
// async function getTranscript() {
//   const transcript = await whisper(filePath, options);
//   console.log(transcript)
// }

// getTranscript();
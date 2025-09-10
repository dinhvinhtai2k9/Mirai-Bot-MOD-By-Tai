module.exports.config = {
    name: "video",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "CatalizCS mod video by Đăng fix by Niiozic",
    description: "Phát video thông qua link YouTube hoặc từ khoá tìm kiếm",
    commandCategory: "Tìm kiếm",
    usages: "[Text]",
    cooldowns: 10,
    envConfig: {
        "YOUTUBE_API": "AIzaSyD8iWL_ZzBgYOpX4f2FTiDwMY_qIhctoRY" // API cũ bạn đã cung cấp
    }
};

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");

module.exports.run = async function ({ api, event, args }) {
    const keyapi = this.config.envConfig.YOUTUBE_API;
    const youtube = new YouTubeAPI(keyapi);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    if (!args.length) return api.sendMessage('❎ Vui lòng nhập từ khoá tìm kiếm hoặc link YouTube', event.threadID, event.messageID);

    const keyword = args.join(" ");
    const videoPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const isURL = videoPattern.test(args[0]);

    if (isURL) {
        try {
            const videoInfo = await ytdl.getInfo(args[0]);
            const id = videoInfo.videoDetails.videoId;
            const filePath = path.join(cacheDir, `${id}.mp4`);

            ytdl(args[0])
                .pipe(fs.createWriteStream(filePath))
                .on("close", () => {
                    if (fs.statSync(filePath).size > 26214400) {
                        fs.unlinkSync(filePath);
                        return api.sendMessage('❎ Không thể gửi video >25MB', event.threadID, event.messageID);
                    }
                    api.sendMessage({ body: `✅ Video: ${videoInfo.videoDetails.title}`, attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
                });
        } catch (err) {
            return api.sendMessage(`❎ Lỗi khi xử lý video: ${err.message}`, event.threadID, event.messageID);
        }
    } else {
        try {
            const results = await youtube.searchVideos(keyword, 10);
            if (!results || !results.length) return api.sendMessage('❎ Không tìm thấy video nào', event.threadID, event.messageID);

            let msg = `[ Có ${results.length} Kết Quả Tìm Kiếm ]\n\n`;
            let linkArr = [];
            let imgArr = [];
            for (let i = 0; i < results.length; i++) {
                const video = results[i];
                if (!video || !video.id) continue;

                const videoLink = `https://www.youtube.com/watch?v=${video.id}`;
                linkArr.push(videoLink);

                const thumbLink = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
                const thumbPath = path.join(cacheDir, `thumb${i + 1}.jpg`);
                const thumbData = await axios.get(thumbLink, { responseType: 'arraybuffer' });
                fs.writeFileSync(thumbPath, Buffer.from(thumbData.data, 'utf-8'));
                imgArr.push(fs.createReadStream(thumbPath));

                msg += `${i + 1}. ${video.title}\n⏰ Kênh: ${video.channel.title}\n📺 Link: ${videoLink}\n\n`;
            }

            msg += '➡️ Reply số thứ tự để chọn video gửi vào nhóm';
            return api.sendMessage({ body: msg, attachment: imgArr }, event.threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    link: linkArr
                });
            }, event.messageID);

        } catch (err) {
            return api.sendMessage(`❎ Lỗi khi tìm kiếm video: ${err.message}`, event.threadID, event.messageID);
        }
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const choice = parseInt(event.body);
    if (isNaN(choice) || !handleReply.link[choice - 1]) return api.sendMessage('❎ Lựa chọn không hợp lệ', event.threadID, event.messageID);

    const videoLink = handleReply.link[choice - 1];

    try {
        const info = await ytdl.getInfo(videoLink);
        const filePath = path.join(cacheDir, `${info.videoDetails.videoId}.mp4`);

        ytdl(videoLink)
            .pipe(fs.createWriteStream(filePath))
            .on("close", () => {
                if (fs.statSync(filePath).size > 26214400) {
                    fs.unlinkSync(filePath);
                    return api.sendMessage('❎ Không thể gửi video >25MB', event.threadID, event.messageID);
                }
                api.sendMessage({ body: `✅ Video: ${info.videoDetails.title}`, attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
            });
    } catch (err) {
        return api.sendMessage(`❎ Lỗi khi xử lý video: ${err.message}`, event.threadID, event.messageID);
    }
};

const fs = require("fs-extra");
const axios = require("axios");
const ytdl = require("ytdl-core");
const YouTubeAPI = require("simple-youtube-api");

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
        "YOUTUBE_API": "AIzaSyD8iWL_ZzBgYOpX4f2FTiDwMY_qIhctoRY"
    }
};

// Tạo folder cache nếu chưa tồn tại
const cachePath = __dirname + "/cache";
if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const youtube = new YouTubeAPI(this.config.envConfig.YOUTUBE_API);

    if (!args.length) return api.sendMessage('❎ Vui lòng nhập từ khóa hoặc link YouTube', threadID, messageID);

    const input = args.join(" ");
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const isUrl = urlPattern.test(input);

    if (isUrl) {
        try {
            const info = await ytdl.getInfo(input);
            const idSafe = info.videoDetails.videoId.replace(/[^0-9a-zA-Z]/g, "_");
            const filePath = `${cachePath}/${idSafe}.mp4`;

            api.sendMessage(`🔄 Đang xử lý video: ${info.videoDetails.title}`, threadID, messageID);

            ytdl(input)
                .pipe(fs.createWriteStream(filePath))
                .on("close", () => {
                    const stats = fs.statSync(filePath);
                    if (stats.size > 26214400) {
                        fs.unlinkSync(filePath);
                        return api.sendMessage(`❎ File quá lớn (>25MB), gửi link thay thế:\n${input}`, threadID, messageID);
                    }
                    api.sendMessage({ body: `✅ ${info.videoDetails.title}`, attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlinkSync(filePath), messageID);
                });

        } catch (err) {
            api.sendMessage("❎ Không thể xử lý video, lỗi: " + err.message, threadID, messageID);
        }

    } else {
        try {
            const results = await youtube.searchVideos(input, 5);
            if (!results.length) return api.sendMessage("❎ Không tìm thấy video nào.", threadID, messageID);

            let msg = "🎬 Kết quả tìm kiếm:\n";
            let links = [];
            let thumbs = [];

            let count = 0;
            for (const video of results) {
                count++;
                msg += `${count}. ${video.title}\n⏰ ${video.duration}\n📺 ${video.channel.title}\n\n`;
                links.push(video.url);

                // Lấy thumbnail
                const thumbPath = `${cachePath}/thumb_${count}.png`;
                const thumbData = (await axios.get(video.thumbnail.url, { responseType: 'arraybuffer' })).data;
                fs.writeFileSync(thumbPath, Buffer.from(thumbData));
                thumbs.push(fs.createReadStream(thumbPath));
            }

            msg += "Reply số tương ứng để chọn video";

            api.sendMessage({ body: msg, attachment: thumbs }, threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    links
                });
            }, messageID);

        } catch (err) {
            api.sendMessage("❎ Lỗi khi tìm kiếm video: " + err.message, threadID, messageID);
        }
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.links.length)
        return api.sendMessage("⚠️ Số bạn chọn không hợp lệ", threadID, messageID);

    const videoUrl = handleReply.links[choice - 1];
    try {
        const info = await ytdl.getInfo(videoUrl);
        const idSafe = info.videoDetails.videoId.replace(/[^0-9a-zA-Z]/g, "_");
        const filePath = `${cachePath}/${idSafe}.mp4`;

        api.sendMessage(`🔄 Đang xử lý video: ${info.videoDetails.title}`, threadID, messageID);

        ytdl(videoUrl)
            .pipe(fs.createWriteStream(filePath))
            .on("close", () => {
                const stats = fs.statSync(filePath);
                if (stats.size > 26214400) {
                    fs.unlinkSync(filePath);
                    return api.sendMessage(`❎ File quá lớn (>25MB), gửi link thay thế:\n${videoUrl}`, threadID, messageID);
                }
                api.sendMessage({ body: `✅ ${info.videoDetails.title}`, attachment: fs.createReadStream(filePath) }, threadID, () => fs.unlinkSync(filePath), messageID);
            });

    } catch (err) {
        api.sendMessage("❎ Không thể tải video, lỗi: " + err.message, threadID, messageID);
    }
};

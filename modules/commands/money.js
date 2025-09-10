module.exports.config = {
    name: "money",
    version: "0.0.1",
    hasPermssion: 0,
    credits: "Mirai Team", // mod by ARAXY XD
    description: "Kiểm tra số tiền của bản thân hoặc người được tag",
    commandCategory: "Tiện ích",
    usages: "[Tag]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const { threadID, messageID, senderID, mentions } = event;
    const fs = require('fs');
    const axios = require('axios');
    const { createCanvas, loadImage, registerFont } = require('canvas');
    const pathCache = __dirname + '/cache';

    // Tạo folder cache nếu chưa tồn tại
    if (!fs.existsSync(pathCache)) fs.mkdirSync(pathCache, { recursive: true });

    // Hàm làm tròn số về phần nguyên gần nhất
    function formatNumber(num) {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Tải font nếu chưa có
    if (!fs.existsSync(pathCache + '/SplineSans-Medium.ttf')) { 
        let getfont = (await axios.get(`https://drive.google.com/u/0/uc?id=102B8O3_0vTn_zla13wzSzMa-vdTZOCmp&export=download`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathCache + "/SplineSans-Medium.ttf", Buffer.from(getfont));
    }
    if (!fs.existsSync(pathCache + '/SplineSans.ttf')) { 
        let getfont2 = (await axios.get(`https://drive.google.com/u/0/uc?id=1--V7DANKLsUx57zg8nLD4b5aiPfHcmwD&export=download`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathCache + "/SplineSans.ttf", Buffer.from(getfont2));
    }

    let name, money;

    if (event.type == "message_reply") {
        const uid = event.messageReply.senderID;
        name = (await Users.getData(uid)).name;
        money = (await Currencies.getData(uid)).money || 0;
    } else if (Object.keys(mentions).length == 1) {
        const mention = Object.keys(mentions)[0];
        name = (await Users.getData(mention)).name;
        money = (await Currencies.getData(mention)).money || 0;
    } else {
        name = (await Users.getData(senderID)).name;
        money = (await Currencies.getData(senderID)).money || 0;
    }

    const argss = formatNumber(money);

    // Tải background
    const pathImage = pathCache + "/atmaraxy.png";
    if (!fs.existsSync(pathImage)) {
        const bg = (await axios.get(`https://i.ibb.co/NZD1Zzz/image.png`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathImage, Buffer.from(bg));
    }
    const bgBase = await loadImage(pathImage);
    const canvas = createCanvas(bgBase.width, bgBase.height);
    const ctx = canvas.getContext("2d");

    // Đăng ký font
    registerFont(pathCache + `/SplineSans-Medium.ttf`, { family: "SplineSans-Medium" });
    registerFont(pathCache + `/SplineSans.ttf`, { family: "SplineSans" });

    // Vẽ hình và text
    ctx.drawImage(bgBase, 0, 0, canvas.width, canvas.height);
    ctx.font = "50px SplineSans-Medium";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(argss + 'đ', 530, 359);

    // Xuất ra buffer
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImage, imageBuffer);

    // Gửi tin nhắn
    return api.sendMessage({
        body: `Số tiền của bạn ${name} đây\nSố tiền của bạn đang có là ${argss}`,
        attachment: fs.createReadStream(pathImage)
    }, threadID, () => fs.unlinkSync(pathImage));
};

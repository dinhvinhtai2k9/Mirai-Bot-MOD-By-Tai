const axios = require('axios');

this.config = {
    name: "help",
    version: "1.1.1",
    hasPermssion: 0,
    credits: "DC-Nam",
    description: "Xem danh sách lệnh và info",
    commandCategory: "Box chat",
    usages: "[tên lệnh/all]",
    cooldowns: 5,
    images: [],
};

this.run = async function({ api, event, args }) {
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const type = args[0]?.toLowerCase() || "";
    let msg = "", array = [], i = 0;
    const cmds = global.client.commands || new Map();
    const TIDdata = global.data.threadData.get(tid) || {};
    const admin = Array.isArray(global.config.ADMINBOT) ? global.config.ADMINBOT : [];
    const NameBot = global.config.BOTNAME || "Bot";
    const version = this.config.version || "1.0";
    const prefix = TIDdata.PREFIX || global.config.PREFIX || "/";

    if (type === "all") {
        for (const cmd of cmds.values()) {
            msg += `${++i}. ${cmd.config.name}\n→ Mô tả: ${cmd.config.description}\n────────────────\n`;
        }
        return api.sendMessage(msg || "❎ Không có lệnh nào", tid, mid);
    }

    if (type) {
        const commandNames = Array.from(cmds.values()).map(c => c.config.name.toLowerCase());
        if (!commandNames.includes(type)) {
            const stringSimilarity = require('string-similarity');
            const checker = stringSimilarity.findBestMatch(type, commandNames);
            const closest = checker.bestMatch.target || "Không tìm thấy";
            msg = `❎ Không tìm thấy lệnh '${type}' trong hệ thống.\n📝 Lệnh gần giống: '${closest}'`;
            return api.sendMessage(msg, tid, mid);
        }

        const cmd = Array.from(cmds.values()).find(c => c.config.name.toLowerCase() === type).config;
        let image = [];
        if (Array.isArray(cmd.images)) {
            for (let imgUrl of cmd.images) {
                try {
                    const stream = (await axios.get(imgUrl, { responseType: "stream" })).data;
                    image.push(stream);
                } catch {}
            }
        }
        msg = `[ HƯỚNG DẪN SỬ DỤNG ]\n─────────────────\n` +
              `[📜] - Tên lệnh: ${cmd.name}\n` +
              `[👤] - Tác giả: ${cmd.credits}\n` +
              `[🌾] - Phiên bản: ${cmd.version}\n` +
              `[🌴] - Quyền Hạn: ${TextPr(cmd.hasPermssion)}\n` +
              `[📝] - Mô Tả: ${cmd.description}\n` +
              `[🏷️] - Nhóm: ${cmd.commandCategory}\n` +
              `[🍁] - Cách Dùng: ${cmd.usages}\n` +
              `[⏳] - Thời Gian Chờ: ${cmd.cooldowns}s\n─────────────────\n📌 Hướng Dẫn Sử Dụng Cho Người Mới`;
        return api.sendMessage({ body: msg, attachment: image }, tid, mid);
    }

    // Xử lý hiển thị menu lệnh theo nhóm
    CmdCategory();
    array.sort(S("nameModule"));
    for (const cmd of array) {
        msg += `│\n│ ${cmd.cmdCategory.toUpperCase()}\n├────────⭔\n│ Tổng lệnh: ${Array.isArray(cmd.nameModule) ? cmd.nameModule.length : 0} lệnh\n│ ${Array.isArray(cmd.nameModule) ? cmd.nameModule.join(", ") : ""}\n├────────⭔\n`;
    }
    msg += `📝 Tổng số lệnh: ${cmds.size || 0} lệnh\n👤 Tổng số admin bot: ${admin.length}\n→ Tên Bot: ${NameBot}\n🔰 Phiên bản: ${version}\n→ Admin: Phạm Minh Đồng\n📎 Link: ${global.config.FACEBOOK_ADMIN || ""}\n${prefix}help + tên lệnh để xem chi tiết\n${prefix}help + all để xem tất cả lệnh`;
    return api.sendMessage(`╭─────────────⭓\n${msg}`, tid);

    function CmdCategory() {
        for (const cmd of cmds.values()) {
            const { commandCategory, hasPermssion, name: nameModule } = cmd.config;
            if (!array.find(i => i.cmdCategory === commandCategory)) {
                array.push({ cmdCategory: commandCategory, permission: hasPermssion, nameModule: [nameModule] });
            } else {
                array.find(i => i.cmdCategory === commandCategory).nameModule.push(nameModule);
            }
        }
    }
};

function S(k) {
    return function(a, b) {
        let i = 0;
        if ((a[k]?.length || 0) > (b[k]?.length || 0)) i = 1;
        else if ((a[k]?.length || 0) < (b[k]?.length || 0)) i = -1;
        return i * -1;
    };
}

function TextPr(permission) {
    return permission == 0 ? "Thành Viên" :
           permission == 1 ? "Quản Trị Viên" :
           permission == 2 ? "Admin Bot" : "Toàn Quyền";
}

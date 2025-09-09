const axios = require('axios');
const moment = require("moment-timezone");
const os = require('os');
const fs = require('fs').promises;

module.exports.config = {
  name: "upt",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Đinh Vĩnh Tài DZ",
  description: "",
  commandCategory: "Hệ Thống",
  cooldowns: 3
};

function byte2mb(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
};

async function getLinuxDistro() {
  try {
    const data = await fs.readFile("/etc/os-release", "utf8");
    const lines = data.split("\n");
    let name = "", version = "";
    for (const line of lines) {
      if (line.startsWith("NAME=")) name = line.split("=")[1].replace(/"/g, "");
      if (line.startsWith("VERSION=")) version = line.split("=")[1].replace(/"/g, "");
    }
    return `${name} ${version}`.trim();
  } catch {
    return "Không xác định (có thể không phải Linux)";
  }
}

module.exports.run = async ({ api, event, Users, Threads }) => {
  try {
    const nwif = os.networkInterfaces();
    const pack = await fs.readFile('package.json', 'utf8');
    const packageObj = JSON.parse(pack);

    const dependencies = packageObj.dependencies ? Object.keys(packageObj.dependencies).length : 0;
    const devDependencies = packageObj.devDependencies ? Object.keys(packageObj.devDependencies).length : 0;

    const threadSetting = (await Threads.getData(String(event.threadID))).data || {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
    const platform = os.platform();
    const arch = os.arch();
    const distro = await getLinuxDistro(); // thêm dòng này
    const cpu_model = os.cpus()[0].model;
    const core = os.cpus().length;
    const speed = os.cpus()[0].speed;
    const byte_fm = os.freemem();
    const byte_tm = os.totalmem();
    const gb_fm = (byte_fm / (1024 * 1024 * 1024)).toFixed(2);
    const gb_tm = (byte_tm / (1024 * 1024 * 1024)).toFixed(2);
    const u_mem = ((byte_tm - byte_fm) / (1024 * 1024 * 1024)).toFixed(2);
    let gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
    const time = process.uptime(),
      hours = Math.floor(time / (60 * 60)),
      minutes = Math.floor((time % (60 * 60)) / 60),
      seconds = Math.floor(time % 60);
    const timeStart = Date.now();
    let name = await Users.getNameUser(event.senderID);
    let threadInfo = await api.getThreadInfo(event.threadID);
    let threadName = threadInfo.threadName;

    const uptimeMessage = `══════╗ ⇲  Uptime  ⇱ ╚══════

⏰ Bây giờ là: ${gio}
⏱️ Thời gian đã hoạt động: ${hours} giờ ${minutes} phút ${seconds} giây.
📝 Dấu lệnh: ${prefix}
👥 Tổng nhóm: ${global.data.allThreadID.length}
🌐 Tổng người dùng: ${global.data.allUserID.length}
📋 Hệ điều hành: ${platform} (${arch})
🐧 Phiên bản Linux: ${distro}
💾 CPU: ${core} core(s) - ${cpu_model} - ${speed}MHz
📊 RAM: ${u_mem}GB / ${gb_tm}GB (Còn trống ${gb_fm}GB)
🗂️ Số Package và Dev Package: ${dependencies} và ${devDependencies}
🗄️ Dung lượng trống: ${gb_fm}GB (Đã dùng ${u_mem}GB trên tổng ${gb_tm}GB)
📶 Ping : ${Date.now() - timeStart}ms
⚡ Tình trạng: ${
      Date.now() - timeStart < 100
        ? 'Rất ổn định'
        : Date.now() - timeStart < 300
          ? 'Khá ổn định'
          : 'Khá chậm'
    }
👤 Yêu cầu bởi: ${name} - ${threadName || 'Cuộc trò chuyện riêng với bot'}`;

    api.sendMessage(uptimeMessage, event.threadID, event.messageID);

  } catch (error) {
    api.sendMessage(`Error: ${error}`, event.threadID);
  }
};

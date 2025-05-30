const { app, globalShortcut, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const screenshot = require("screenshot-desktop");

const screenshotDir = path.join(__dirname, "screenshots");

// 确保 screenshots 文件夹存在
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
}

async function captureScreen() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tmpFilename = `screenshot-tmp.png`; // 固定上传图
    const historyFilename = `screenshot-${timestamp}.png`; // 保留历史
    const tmpPath = path.join(screenshotDir, tmpFilename);
    const historyPath = path.join(screenshotDir, historyFilename);

    try {
        const imgBuffer = await screenshot({ format: "png" });

        // 保存一份临时上传图
        fs.writeFileSync(tmpPath, imgBuffer);
        console.log("📸 临时截图保存成功:", tmpPath);

        // 同时保存一份历史图
        fs.writeFileSync(historyPath, imgBuffer);
        console.log("🗂️ 历史截图已保存:", historyPath);

        // 上传临时图
        const form = new FormData();
        form.append("file", fs.createReadStream(tmpPath));

        const response = await axios.post("http://localhost:8000/upload", form, {
            headers: form.getHeaders(),
        });

        console.log("\n🧠 AI 回答：\n" + response.data.answer);
    } catch (err) {
        console.error("❌ 截图或上传失败:", err);
    }
}

// 旧的截图函数，保留以备参考
// async function captureScreen() {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     //const filename = `screenshot-${timestamp}.jpg`;
//     const filename = `screenshot-tmp.png`; // 使用 PNG 格式
//     const filepath = path.join(screenshotDir, filename);

//     try {
//         // ✅ 高清截图
//         const imgBuffer = await screenshot({ format: 'png' });
//         fs.writeFileSync(filepath, imgBuffer);
//         console.log('📸 高清截图保存成功:', filepath);

//         // 上传截图到后端接口
//         const form = new FormData();
//         form.append('file', fs.createReadStream(filepath));

//         const response = await axios.post('http://localhost:8000/upload', form, {
//             headers: form.getHeaders()
//         });

//         console.log('\n🧠 AI 回答：\n' + response.data.answer);
//     } catch (err) {
//         console.error('❌ 截图或上传失败:', err.message);
//     }
// }

app.whenReady().then(() => {
    const registered = globalShortcut.register("CommandOrControl+Shift+S", () => {
        console.log("⌨️ 快捷键触发，正在截图...");
        captureScreen();
    });

    if (!registered) {
        console.log("❌ 快捷键注册失败");
    }

    // 隐藏窗口，保持 app 活跃
    new BrowserWindow({ show: false });

    console.log("🚀 SnapMind Electron 客户端已启动，按 Ctrl+Shift+S 开始截图");
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

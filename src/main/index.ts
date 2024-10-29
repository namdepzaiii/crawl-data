/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, ipcMain } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import {
    insertData,
    deleteData,
    queryData,
    updateData_nowhere,
} from "./database";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

let workers_lst: Worker[] = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let keywordArray: string[] = [];
let mainWindow: BrowserWindow | null; // Khai báo biến mainWindow

async function startWorkerThread(
    name: string,
    keywordPart: string[],
    values: JSON
) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(join(__dirname, "../../src/main/worker.ts"), {
        // const worker = new Worker(join(__dirname,"/worker.js"), {
            workerData: { name, keywordArray: keywordPart, values }, // Truyền dữ liệu vào worker
        });
        workers_lst.push(worker);
        worker.on("message", async (msg) => {
            if (msg.status === "success") {
                try {
                    await savePostsToDatabase(msg.posts); // Sử dụng await ở đây
                    resolve(msg);
                } catch (error) {
                    console.error("Error saving posts:", error);
                    reject(error); // Từ chối Promise nếu có lỗi
                }
            } else if (msg.status === "success_crawl") {
                try {
                    if (mainWindow) {
                        // Kiểm tra mainWindow có tồn tại không
                        mainWindow.webContents.send("success_crawl");
                    }
                } catch (error) {
                    console.error("Error sending message:", error);
                    reject(error); // Từ chối Promise nếu có lỗi
                }
            }
        });

        worker.on("error", (error) => {
            console.error("Worker error:", error);
            reject(error); // Từ chối Promise nếu có lỗi từ worker
        });

        worker.on("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`)); // Từ chối Promise nếu worker thoát với mã lỗi
            }
        });
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function startWorkerposts(values: any) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(join(__dirname, "../../src/main/worker_posts.ts"), {
        // const worker = new Worker(join(__dirname, "/worker_posts.js"), {
            workerData: { values },
        })
    })
}


// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function savePostsToDatabase(posts) {
    let id_post = Date.now();
    for (const post of posts) {
        id_post += 1;
        const columns = ["id_post", "title", "href", "id", "content"];
        const values = [
            id_post,
            post.title,
            post.href,
            post.id,
            `"${post.content}"`,
        ];
        await insertData("posts", columns, values, (err, lastID) => {
            if (err) {
                console.error("Error inserting data:", err.message);
            } else {
                console.log(`Post inserted with ID: ${id_post}`);
            }
        });
    }
    if (mainWindow) {
        await queryDatabaseAndSend(mainWindow);
    }
}

async function queryDatabaseAndSend(mainWindow: BrowserWindow) {
    const sql = `SELECT id_post, title, href, content, id FROM posts`;
    await queryData(sql, [], (err, rows) => {
        if (err) {
            console.error("Error querying database:", err.message);
        } else {
            mainWindow.webContents.send("response_data", JSON.stringify(rows));
        }
    });
}

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
        queryDatabaseAndSend(mainWindow);
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId("com.electron");
    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// Xử lý IPC cho các sự kiện
ipcMain.on("start_handle", async (event, values) => {
    updateData_nowhere(
        [
            values.keyword,
            values.url,
            values.couldnt_find,
            values.postElements,
            values.title,
            values.href,
            values.content
        ],
        (err) => {
            if (err) {
                console.log("update-error", "co loi xay ra voi sql.");
            } else {
                console.log("update-success", "cap nhat thanh cong");
            }
        }
    );

    if (values.keyword) {
        keywordArray = values.keyword.split(",").map((keyword) => keyword.trim());
        if (keywordArray.length < 2) {
            await startWorkerThread("Thread 1", keywordArray, values); // Chờ worker hoàn thành
            return true;
        } else {
            const half = Math.ceil(keywordArray.length / 2);
            const firstHalf = keywordArray.slice(0, half);
            const secondHalf = keywordArray.slice(half);
            startWorkerThread("Thread 1", firstHalf, values);
            startWorkerThread("Thread 2", secondHalf, values);
            return true;
        }
    }
});
ipcMain.on("stopWorker", async (event) => {
    try {
        for (let worker of workers_lst) {
            if (worker) {
                await worker.terminate();
                console.log("off 1 worker.");
            }
        }
        workers_lst = []; // Đặt lại mảng workers
        console.log("All workers have been terminated.");
    } catch (error) {
        console.error("Error stopping workers:", error);
    }
});

function sendSettingsFromDatabase(mainWindow: BrowserWindow) {
    const sql = `SELECT kw, url, couldnt_find, postElements, title, href, content FROM setting_tb`; // Truy vấn dữ liệu từ bảng setting_tb
    queryData(sql, [], (err, rows) => {
        if (err) {
            console.error("Error querying settings from database:", err.message);
        } else {
            const settings = rows[0] || {
                kw: "",
                url: "",
                couldnt_find: "",
                postElements: "",
                title: "",
                href: "",
                content: "",
            };
            const settingsData = {
                keyword: settings.kw,
                url: settings.url,
                couldnt_find: settings.couldnt_find,
                postElements: settings.postElements,
                title: settings.title,
                href: settings.href,
                content: settings.content,
            };
            mainWindow.webContents.send(
                "response_settings",
                JSON.stringify(settingsData)
            );
        }
    });
}

// Yêu cầu cài đặt từ renderer process
ipcMain.on("request_settings", (event) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        sendSettingsFromDatabase(focusedWindow);
    }
});

// Xóa bài viết
ipcMain.on("delete_post", (event, id) => {
    deleteData(id, (err) => {
        if (err) {
            event.reply("delete_response", { success: false, error: err.message });
        } else {
            queryDatabaseAndSend(BrowserWindow.getFocusedWindow());
            event.reply("delete_response", { success: true });
        }
    });
});




ipcMain.on("hidemium_post", async (event, id) => {
    const sql = `SELECT id_post, title, href, content, id FROM posts`;
    await queryData(sql, [], async (err, rows) => {
        if (err) {
            console.error("Error querying2 database:", err.message);
        } else {
            if (rows) {
                if (rows.length < 2) {
                    await startWorkerposts(rows); // Chờ worker hoàn thành
                    return true;
                } else {
                    const half = Math.ceil(rows.length / 2);
                    const firstHalf = rows.slice(0, half);
                    const secondHalf = rows.slice(half);
                    startWorkerposts(firstHalf);
                    startWorkerposts(secondHalf);
                    return true;
                }
            }


        }
    });
});

/* eslint-disable prettier/prettier */
const { workerData, parentPort } = require('worker_threads');
const { values } = workerData;
const puppeteer = require('puppeteer');
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
async function dangbai() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--mute-audio', '--window-size=800,500', '--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://forum.hidemium.io', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.btn.btn-icon-text.btn-primary.btn-small.login-button');
    await page.click('.btn.btn-icon-text.btn-primary.btn-small.login-button');
    await sleep(2000);
    await page.waitForSelector('#login-account-name');
    await page.type('#login-account-name', 'namdepzai6111');
    await page.waitForSelector('#login-account-password');
    await page.type('#login-account-password', 'aeghewh34r4h35ryh5eh335rh24hwe4h24h2w4ehwg4g');
    await page.keyboard.press('Enter');


    let post;
    while (true) {
        if (!values) {
                await browser.close();
                return true
        }
        post = values[0];
        values.shift();
        console.log(JSON.stringify(post));
        for (let i = 0; i < 5; i++) {
            try {
                console.log('create-topic');
                await sleep(2000);
                await page.waitForSelector('#create-topic');
                await page.click('#create-topic');
                await sleep(2000);
                await page.waitForSelector('#reply-title');
                await page.type('#reply-title', post.title);
                await page.type('textarea[aria-label="Type here. Use Markdown, BBCode, or HTML to format. Drag or paste images."]', post.content);
                console.log('submit');
                await page.click('.btn.btn-icon-text.btn-primary.create');
                await sleep(5000);
                await page.goto('https://forum.hidemium.io', { waitUntil: 'domcontentloaded' });
            }
            catch (err) {
                await sleep(2000);
                console.log('error : '+err);
            }
        }
    }}
dangbai()
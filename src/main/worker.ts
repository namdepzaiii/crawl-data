/* eslint-disable prettier/prettier */
const { workerData, parentPort } = require('worker_threads');
const { name, keywordArray , values} = workerData;
const puppeteer = require('puppeteer'); 
const fs = require('fs'); 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function browser_crawl(key) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--mute-audio', '--window-size=250,710', '--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(values.url + key, { waitUntil: 'domcontentloaded' });
  let isLoaded = false; 
  let posts = [];
  const classSelector = '.text-neutral-content.font-semibold.text-16.xs\\:text-18.mb-xs'; 
  // const classSelector = values.couldnt_find; 
  // const postElements_1= values.postElements;
  while (!isLoaded) {
    const classElement = await page.$(classSelector);
    const content = await page.content();
    if (classElement) {
      const textContent = await page.evaluate(element => element.textContent, classElement);
      if (textContent.includes("we couldn’t find any results for")) {
        console.log(`KHONG TIM THAY KET QUA CHO : ${key}`);
        await browser.close();
        return 1;
      }
    }

    else if (content.includes("no healthy upstream")) {
      console.log("Found 'no healthy upstream', reloading the page...");
      await page.reload({ waitUntil: 'domcontentloaded' });
    } else {
      try {
        posts = await page.evaluate((values) => {
          const postElements = document.querySelectorAll('faceplate-tracker[data-testid="search-post"]');
          return Array.from(postElements).map(element => {
            const title = element.querySelector(values.title)?.getAttribute('aria-label'); // Lấy tiêu đề
            const href = element.querySelector(values.href)?.getAttribute('href'); // Lấy đường dẫn
            const trackingContext = element.getAttribute(values.content); // Lấy thuộc tính tracking context
        
            let id = null;
            if (trackingContext) {
              const parsedContext = JSON.parse(trackingContext);
              id = parsedContext.post.id;
            }
        
            return title && href && id ? { title, href: `https://www.reddit.com${href}`, id } : null; 
          }).filter(post => post !== null);
        }, values);

        
        if (posts.length > 0) { // Kiểm tra nếu có bài viết
          console.log("Found 'faceplate-tracker[data-testid=\"search-post\"]', returning true...");
          isLoaded = true; 
        }
      } catch (error) {
      }
    }
  }
  
  for (const post of posts) {
    const { href, id } = post;
    await page.goto(`${href}`, { waitUntil: 'domcontentloaded' });
    const content = await page.evaluate((postId) => {
      const element = document.getElementById(postId + "-post-rtjson-content");
      return element ? element.textContent : null; // Trả về nội dung hoặc null nếu không tìm thấy
    }, id);
    post.content = content;
    parentPort.postMessage({ status: 'success_crawl', posts: posts });

  }
  parentPort.postMessage({ status: 'success', posts: posts });
    await browser.close();
}


async function browser() {
  while (true) {
    if (keywordArray.length === 0) {
      return true; 
    }

    const keyword = keywordArray.shift(); 
    await browser_crawl(keyword); 
    console.log(`${name} xu li xong keyword: ${keyword}`);
  }
}

try {
  browser()
} catch (error) {
    console.error("Error in worker:", error);
    process.exit(1); 
}

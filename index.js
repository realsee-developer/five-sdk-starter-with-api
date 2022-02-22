const http = require('http')
const https = require('https')
const crypto = require('crypto')
const crc32 = require('crc32')

const AppKey = 'Your-App-Key'
const AppSecret = 'Your-App-Secret'

function sha256 (token, salt) {
  return crypto.createHmac('SHA256', salt).update(token).digest('hex')
}

function md5 (token) {
  return crypto.createHash('md5').update(token).digest('hex')
}

async function request (api, paramString) {
  return new Promise((resolve, reject) => {
    // 接口验签
    const bodyCrc32 = Number('0x' + crc32(paramString))
    const stringToSign = `body_crc32=${bodyCrc32}method=GETurl=${api}`
    const timestamp = (Date.now() / 1000).toFixed()
    const salt = md5(AppKey + AppSecret + timestamp).toUpperCase()
    const signature = sha256(stringToSign, salt).toUpperCase()
    const authorization = Buffer.from(AppKey + ':' + signature + ':' + timestamp).toString('base64')
    const headers = { Authorization: authorization }

    https.get(
      `https://app-gateway.realsee.com${api}?${paramString}`,
      { headers },
      res => {
        let rawData = ''
        res.setEncoding('utf8')
        res.on('data', chunk => { rawData += chunk })
        res.on('error', e => {
          reject(new Error(`request api(${api}) error: ${e.message}`))
        })
        res.on('end', () => {
          const parsedData = JSON.parse(rawData)
          resolve(parsedData)
        })
      })
      .on('error', e => {
        reject(new Error(`request api${api} error: ${e.message}`))
      })
  })
}

function html (workJSONObject) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Five Work Preview</title>
  <style>
    * { margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; overflow: hidden; }
    #app { position: fixed; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; }
    .buttons { position: fixed; top: 10px; left: 10px; pointer-events: none; }
    .buttons h3 { margin-top: 10px; text-shadow: 0 0 2px rgba(255, 255, 255, 0.5); }
    .buttons button { pointer-events: auto; display: block; font-size: 14px; color: #FFF; background: #5a6268; padding: 3px 10px; border: 1px solid #333; margin-right: 2px; border-radius: 2px; cursor: pointer; margin-top: 10px; }
    .buttons button:active { background: #333; }
  </style>
  <script src="https://unpkg.com/three@0.117.1/build/three.min.js"></script>
  <script src="https://unpkg.com/@realsee/five/umd/five.js"></script>
  <script>const workJSON = ${JSON.stringify(workJSONObject)}</script>
</head>
<body>
<!-- 试图渲染容器 -->
<div id="app"></div>
<script>
const five = new FiveSDK.Five();
five.appendTo(document.getElementById("app"));
const work = FiveSDK.parseWork(workJSON);
five.load(work);
const buttons = document.createElement("div");
buttons.className = "buttons";
document.body.appendChild(buttons);
window.addEventListener('resize', () => five.refresh())

const modeButtons = [
  { mode: "Panorama", label: "全景模式" },
  { mode: "FloorPlan", label: "模型纵览模式" },
  { mode: "TopView", label: "模型俯视模式" },
  { mode: "Model", label: "模型漫游模式" },
];

buttons.appendChild(document.createElement("h3")).innerHTML = "模式控制";

// 模态按钮
for (let i = 0; i < modeButtons.length; i++) {
  const button = document.createElement("button");
  button.innerHTML = modeButtons[i].label;
  button.addEventListener('click', () => {
    // 通过 changeMode 方法可以切换模态
    five.changeMode(FiveSDK.Five.Mode[modeButtons[i].mode]);
  });
  buttons.appendChild(button);
}
</script>
</body>
</html>
`
}

const app = http.createServer(async (req, res) => {
  // 请求VR列表
  // 接口文档 https://developers.realsee.com/docs/#/docs/five/server/openapi
  try {
    const workListRes = await request('/open/v1/entity/vr/list', 'page=1')
    if (workListRes.code !== 0) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(workListRes))
      return
    }
    if (!workListRes.data.list.length) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      // 企业生产环境中使用API回调监听相关项目状态更新。此处仅简要示意。请在如视VR应用中查看您拍摄的项目进度
      res.end('暂未拍摄项目或项目正在处理。请在App内查看项目处理进度，处理完成后刷新')
      return
    }
    const latestWorkCode = workListRes.data.list.sort((a, b) => (Date.parse(b.create_time) - Date.parse(a.create_time)))[0].vr_code
    // 请求VR空间数据
    const workRes = await request('/open/v1/entity/vr', 'vr_code=' + latestWorkCode)
    if (workRes.code !== 0) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(workRes))
      return
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(html(workRes.data))
  } catch (e) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(e.toString())
  }
})

app.listen(3000, () => {
  console.log('serve at http://127.0.0.1:3000')
})

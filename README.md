### 3分钟跑通采集预览（Node版）

该项目会请求开发者中心API接口，使用SDK展示最新一条处理完成的VR。

#### 操作前提

- 您的机器已安装 [Node 和 npm](https://nodejs.org/en/)
- 您方便操作的苹果手机（用于快速拍摄VR）

#### 操作步骤

第一步：注册/登录[如视开发者中心控制台](https://developers.realsee.com/console) ，点击`申请密钥`，获取您的`Application Id` 和 `Application Secret`
，此凭证将用于访问API接口获取空间数据

第二步：手机应用商店搜索`如视VR`，安装并登录**第一步**中注册/登录的账号

继续在App内操作

- `我的` - `身份选择` - `个人`（默认）
- 点击底部`加号按钮`创建项目 - `手机拍`（暂时仅支持iOS） - 点击`创建项目`
- 按照App操作指引完成拍摄并上传，等待VR项目处理完成（此过程大致需要几分钟）

第三步：`git clone` 或 `download zip` [five-sdk-starter-with-api](https://github.com/realsee-developer/five-sdk-starter-with-api)

修改`index.js`，搜索`Your-App-Key`字符串替换成第一步中申请的`Application Id`，搜索`Your-App-Secret`字符串替换成第一步中申请的`Application Secret`

```shell
cd five-sdk-starter-with-api
npm i
npm run start
# 您会看到控制台输出，浏览器打开下面的链接，建议使用Chrome浏览器保证最佳体验
> node index.js
> serve at http://127.0.0.1:3000
```



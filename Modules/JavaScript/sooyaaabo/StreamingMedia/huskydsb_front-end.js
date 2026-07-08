const html = `
<!DOCTYPE html>
<html lang="zh">
<head>
    <!-- 设置字符编码为UTF-8 -->
    <meta charset="UTF-8">
    <!-- 设置视口大小，使页面适应移动设备的宽度 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- 设置主题颜色 -->
    <meta name="theme-color" content="#ffffff">
    <!-- 设置为支持Web应用模式 -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <!-- 设置Web应用状态栏风格 -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <!-- 设置网站图标 -->
    <link rel="icon" href="https://www.shadowrocketdownload.com/img/logo.png" sizes="192x192">
    <!-- 设置苹果设备的触控图标 -->
    <link rel="apple-touch-icon" href="https://www.shadowrocketdownload.com/img/logo.png" sizes="180x180">
    <!-- 设置PNG格式的图标 -->
    <link rel="icon" type="image/png" href="https://www.shadowrocketdownload.com/img/logo.png" sizes="64x64">
    <!-- 页面标题 -->
    <title>常规流媒体服务解锁查询</title>
    <style>
        /* 设置页面字体和背景 */
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif;
            background-color: #f7f7f7;
            background-image: url('https://raw.githubusercontent.com/huskydsb/Shadowrocket/main/Streaming/icon/cool-background.png');
            background-size: cover;
            background-position: center;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            transition: background-color 0.3s ease;
        }
        /* 设置页面标题区样式 */
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            margin-top: 16px;
        }
        .header a {
            display: flex;
            align-items: center;
            text-decoration: none;
        }
        /* 设置Logo样式 */
        .header img {
            width: 60px;
            height: 60px;
            margin-right: 15px;
        }
        /* 设置标题文本样式，背景渐变效果 */
        .header h1 {
            font-size: 28px;
            font-weight: bold;
            color: transparent;
            background: linear-gradient(45deg, #ff0077, #5900b3, #00b3b3);
            -webkit-background-clip: text;
            background-clip: text;
            margin: 0;
            text-align: center;
        }
        /* 设置容器的样式，使用网格布局 */
        .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 18px;
            width: 90%;
            max-width: 1000px;
            margin-bottom: 50px;
            padding: 10px;
        }
        /* 响应式设计，当宽度小于480px时 */
        @media (max-width: 480px) {
            .container {
                grid-template-columns: repeat(2, minmax(120px, 1fr));
                gap: 15px;
            }
            .module {
                padding: 15px;
            }
            .module img {
                width: 60px;
                height: 60px;
            }
            .module span {
                font-size: 16px;
            }
        }
        /* 响应式设计，当宽度在481px到768px之间时 */
        @media (min-width: 481px) and (max-width: 768px) {
            .container {
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            }
        }
        /* 设置每个模块的样式 */
        .module {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid #ddd;
            border-radius: 12px;
            background-color: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease-in-out;
            color: #444;
            aspect-ratio: 1/1;
        }
        /* 模块悬浮时的效果 */
        .module:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        /* 设置模块图标样式 */
        .module img {
            width: 80px;
            height: 80px;
            margin-bottom: 15px;
            object-fit: contain;
        }
        /* 设置模块标题文本样式 */
        .module span {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            text-align: center;
        }
        /* 设置暗黑模式下的样式 */
        @media (prefers-color-scheme: dark) {
            .module {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 0, 0.2);
            }
            .module img {
                transition: transform 0.3s ease;
            }
            .module:hover img {
                transform: scale(1.1);
            }
            .module:hover {
                transform: translateY(-10px);
                box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
            }
            body {
                background-color: #121212;
            }
            #result-popup {
                background-color: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            #result-popup h2 {
                color: #fff;
            }
            #result-popup p {
                color: #bbb;
            }
            #close-btn {
                background-color: #d32f2f;
            }
            #copy-btn {
                background-color: #388e3c;
            }
        }
        /* 设置弹出框的样式 */
        #result-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 75%;
            max-width: 600px;
            background-color: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            padding: 20px;
            display: none;
            z-index: 1000;
            box-sizing: border-box;
            color: #444;
        }
        /* 弹出框标题样式 */
        #result-popup h2 {
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #444;
            text-align: center;
        }
        /* 弹出框消息文本样式 */
        #result-popup p {
            margin: 0 0 20px 0;
            font-size: 16px;
            text-align: center;
            color: #666;
        }
        /* 设置按钮容器的样式 */
        .buttons {
            display: flex;
            justify-content: space-around;
            gap: 30px;
        }
        /* 设置按钮的样式 */
        #close-btn, #copy-btn {
            background: linear-gradient(45deg, #4a90e2, #6fcf97);
            border: none;
            color: white;
            transition: all 0.3s ease;
            padding: 10px 40px;
            font-size: 18px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        /* 按钮悬浮时的效果 */
        #close-btn:hover, #copy-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
        }
        /* 按钮点击时的效果 */
        #close-btn:active, #copy-btn:active {
            transform: translateY(2px);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <!-- 页面标题区域 -->
    <div class="header">
        <a href="https://t.me/ShadowrocketApp" target="_blank">
            <img class="logo" src="https://www.shadowrocketdownload.com/img/logo.png" alt="Logo">
            <h1>常规流媒体服务解锁查询</h1>
        </a>
    </div>

    <!-- 服务模块展示区域 -->
    <div id="container" class="container"></div>

    <!-- 弹出框显示测试结果 -->
    <div id="result-popup">
        <h2 id="popup-title"></h2>
        <p id="popup-message"></p>
        <div class="buttons">
            <button id="close-btn">关闭</button>
            <button id="copy-btn">复制</button>
        </div>
    </div>

    <script>
        // 设置基础URL
        const baseUrl = "https://streaming.test";

        // 设置流媒体服务列表
        const streamingServices = [
            { name: 'YouTube', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/YouTube_2024.svg/2560px-YouTube_2024.svg.png', endpoint: 'youtube' },
            { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png', endpoint: 'netflix' },
            { name: 'ChatGPT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/2560px-OpenAI_Logo.svg.png', endpoint: 'chatgpt' },
            { name: 'TikTok', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/2560px-TikTok_logo.svg.png', endpoint: 'tiktok' },
            { name: 'Disney+', logo: 'https://upload.wikimedia.org/wikipedia/commons/archive/7/77/20230514165915%21Disney_Plus_logo.svg', endpoint: 'disney' },
            { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/2560px-Spotify_logo_with_text.svg.png', endpoint: 'spotify' },
            { name: 'Scamalytics', logo: 'https://scamalytics.com/wp-content/uploads/2016/09/Scamalytics_Logo_horizontal_no_background_no_strapline-1024x226.png', endpoint: 'scamalytics' },
            { name: 'Bing', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Bing_Fluent_Logo_Text.svg/2535px-Bing_Fluent_Logo_Text.svg.png', endpoint: 'bing' },            
            { name: 'Bilibili', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Bilibili_logo.svg/2560px-Bilibili_logo.svg.png', endpoint: 'bilibili' },
            { name: 'Steam', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png', endpoint: 'steam' },
            { name: 'PrimeVideo', logo: 'https://logos-world.net/wp-content/uploads/2021/04/Amazon-Prime-Video-Logo.png', endpoint: 'primevideo' },
            { name: 'HBO Max', logo: 'https://logotyp.us/file/hbo-max.svg', endpoint: 'max' },
            { name: 'Bahamut', logo: 'https://i2.bahamut.com.tw/anime/logo.svg', endpoint: 'bahamut' },
            { name: 'ニコニコ', logo: 'https://raw.githubusercontent.com/huskydsb/Shadowrocket/main/Streaming/icon/niconco.png', endpoint: 'nicovideo' },
            { name: 'Google Play', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_Play_2022_icon.svg/1856px-Google_Play_2022_icon.svg.png', endpoint: 'googleplay' },
            { name: 'Wikipedia', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png', endpoint: 'wikipedia' },
            { name: 'Starz', logo: 'https://www.starz.com/assets/images/icons/starz-logo-glint.svg' ,endpoint: 'starz' },
            { name: 'iQIYI', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Iqiyi_Logo_Baru.png', endpoint: 'iqiyi' },
            { name: 'DAZN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/DAZN_Logo_Master.svg/2048px-DAZN_Logo_Master.svg.png', endpoint: 'dazn' },
            { name: 'ParamountPlus', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Paramount_Plus.svg/2560px-Paramount_Plus.svg.png', endpoint: 'paramountplus' },
            { name: 'ViuTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/ViuTV_logo.svg/2560px-ViuTV_logo.svg.png', endpoint: 'viutv' },
            { name: 'Now E', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/NowE_logo_rgb.svg/2560px-NowE_logo_rgb.svg.png', endpoint: 'nowe' },
            { name: 'KKTV', logo: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/KKTV.png', endpoint: 'kktv' },              
            { name: 'LINE TV', logo: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/LineTV.png', endpoint: 'linetv' },
            { name: 'IPv6', logo: 'https://raw.githubusercontent.com/huskydsb/Shadowrocket/main/Streaming/icon/ip.png', endpoint: 'ip' },
            { name: 'DNS', logo: 'https://raw.githubusercontent.com/huskydsb/Shadowrocket/main/Streaming/icon/dns.png', endpoint: 'dns' }
         ];

        // 获取容器和弹出框元素
        const container = document.getElementById('container');
        const resultPopup = document.getElementById('result-popup');
        const popupTitle = document.getElementById('popup-title');
        const popupMessage = document.getElementById('popup-message');
        const closeBtn = document.getElementById('close-btn');
        const copyBtn = document.getElementById('copy-btn');

        // 创建每个流媒体服务的模块
        function createModule(service) {
            const moduleDiv = document.createElement('div');
            moduleDiv.className = 'module';
            moduleDiv.innerHTML = \`
                <img src="\${service.logo}" alt="\${service.name} Logo">
                <span>\${service.name}</span>
            \`;
            moduleDiv.addEventListener('click', () => runTest(service.name, service.endpoint));
            return moduleDiv;
        }

        // 将所有流媒体服务模块添加到页面中
        streamingServices.forEach(service => {
            container.appendChild(createModule(service));
        });

        // 运行测试并显示结果
        async function runTest(name, endpoint) {
            const url = \`\${baseUrl}/\${endpoint}\`;

            popupTitle.textContent = \`正在测试 \${name}\`;
            popupMessage.textContent = '请稍候...';
            resultPopup.style.display = 'block';

            try {
                const response = await fetch(url, { method: 'GET' });
                if (!response.ok) throw new Error('请求失败');
                const result = await response.json();

                popupTitle.textContent = \`\${name} 测试结果\`;
                const resultMessage = result.message || "未知结果";

                popupMessage.innerHTML = resultMessage;
                console.log(\`\${name} 测试结果：\`, resultMessage);
            } catch (error) {
                popupTitle.textContent = \`\${name} 测试失败\`;
                popupMessage.textContent = '请检查网络连接或分流规则';
            }
        }

        // 关闭弹出框
        closeBtn.addEventListener('click', () => {
            resultPopup.style.display = 'none';
        });
        // 复制结果并关闭弹窗
        copyBtn.addEventListener('click', () => {
    const text = popupMessage.textContent;
    navigator.clipboard.writeText(text)
        .then(() => {
            resultPopup.style.display = 'none';  // 复制后关闭弹窗
        })
        .catch(() => {
            alert('复制失败!');
        });
});
    </script>
</body>
</html>
`;

$done({
  response: {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    body: html
  }
});
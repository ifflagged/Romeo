<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="description" content="墨鱼手记的个人资源索引：影视、动漫、下载、工具、阅读、音乐、QX脚本等实用入口。">
	<meta name="keywords" content="墨鱼手记, 墨鱼索引, 资源导航, QX, QuantumultX, 去广告, 工具, 影视">
	<meta property="og:type" content="website">
	<meta property="og:title" content="墨魚手記 · ddgksf2013">
	<meta property="og:description" content="实用资源入口合集，持续更新！">
	<meta name="twitter:card" content="summary_large_image">
	<link rel="canonical" href="https://ddgksf2013.top/">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>墨魚手記 | 一些好用的資源入口</title>
    <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
    <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
<style>
    /* ================= 1. 全局变量与基础设置 ================= */
    :root {
        --sidebar-w: 240px;
        --primary: #3b82f6;
        --bg-body: #f0f2f5;
        --bg-card: #ffffff;
        --text-main: #333333;
        --text-sub: #666666;
        --border: #e5e7eb;
        --grid-line: rgba(0, 0, 0, 0.04);
        --header-h-mobile: 60px;
    }

    [data-theme="dark"] {
        --bg-body: #111827;
        --bg-card: #1f2937;
        --text-main: #f3f4f6;
        --text-sub: #9ca3af;
        --border: #374151;
        --grid-line: rgba(255, 255, 255, 0.05);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; outline: none; -webkit-tap-highlight-color: transparent; }

    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text-main);
        background-color: var(--bg-body);
        display: flex;
        height: 100vh;
        overflow: hidden; 
    }

    a { text-decoration: none; color: inherit; }
    .clickable { color: blue; cursor: pointer; text-decoration: none; }
    .clickable:hover { text-decoration: underline; }

    /* ================= 2. 布局：侧边栏 (Sidebar) ================= */
    .sidebar {
        width: var(--sidebar-w);
        background: var(--bg-card);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        z-index: 1100;
        transition: transform 0.3s ease;
        height: 100%;
        flex-shrink: 0;
    }

    .logo {
        height: 60px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--primary);
        border-bottom: 1px solid var(--border);
        cursor: pointer;
        flex-shrink: 0;
    }
    .logo i { margin-right: 8px; font-size: 1.4rem; }

    .nav-menu { flex: 1; overflow-y: auto; padding: 10px 0; }

    .nav-item {
        padding: 10px 20px;
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--text-sub);
        display: flex;
        align-items: center;
        transition: 0.2s;
        border-left: 3px solid transparent;
    }
    .nav-item i { margin-right: 10px; font-size: 1.1rem; width: 20px; text-align: center; }
    .nav-item:hover { background: var(--bg-body); color: var(--primary); }
    .nav-item.active { 
        background: var(--bg-body); 
        color: var(--primary); 
        border-left-color: var(--primary); 
        font-weight: 600; 
    }

    .sidebar-footer {
        padding: 15px;
        border-top: 1px solid var(--border);
        font-size: 12px;
        color: var(--text-sub);
        background: var(--bg-card);
    }
    .run-time { display: block; margin-bottom: 5px; opacity: 0.8; }
    .app-version { 
        display: inline-block; 
        background: rgba(59, 130, 246, 0.1); 
        color: var(--primary);
        padding: 2px 6px; 
        border-radius: 4px; 
        font-weight: bold;
    }

    .dev-tools { padding: 15px; border-top: 1px solid var(--border); background: var(--bg-card); }
    .btn-tool {
        width: 100%; padding: 8px; border: 1px solid var(--border);
        background: transparent; color: var(--text-sub); border-radius: 6px;
        margin-top: 8px; cursor: pointer; display: flex; align-items: center;
        justify-content: center; gap: 5px; font-size: 0.85rem; transition: 0.2s;
    }
    .btn-tool:hover { border-color: var(--primary); color: var(--primary); }
    .btn-primary { background: var(--primary); color: white; border: none; }

    .sidebar-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1050;
        display: none; opacity: 0; transition: opacity 0.3s; backdrop-filter: blur(2px);
    }
    .sidebar-overlay.show { display: block; opacity: 1; }

    /* ================= 3. 布局：主区域 (Main) ================= */
    .main-viewport {
        flex: 1;
        height: 100%;
        overflow-y: auto;
        scroll-behavior: smooth;
        background-image: 
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
        background-size: 20px 20px;
        position: relative;
    }

    /* 顶部 Banner 与 搜索 */
    .banner {
        height: 220px;
        background-image: url('bg.jpg'); 
        background-color: #3b82f6; 
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        padding: 20px; color: white; background-size: cover; background-position: center;
        background-repeat: no-repeat; transition: height 0.3s;
    }
    .banner h1 { font-size: 1.6rem; margin-bottom: 15px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-align: center;}
    
    .search-container { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 10px; }
    .search-bar { position: relative; width: 100%; }
    .search-bar input {
        width: 100%; padding: 12px 20px 12px 45px;
        border-radius: 50px; border: none;
        background: rgba(255,255,255,0.95);
        font-size: 0.95rem; box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        transition: all 0.3s;
    }
    .search-bar i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }

    /* 滚动公告 */
    .notice-bar {
        height: 24px; background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(4px);
        border-radius: 12px; display: flex; align-items: center; padding: 0 10px;
        font-size: 12px; color: rgba(255,255,255, 0.9); overflow: hidden;
        border: 1px solid rgba(255,255,255,0.15); margin-top: 5px;
    }
    .notice-icon { margin-right: 6px; font-size: 12px; animation: bellShake 3s infinite; }
    .notice-content { flex: 1; height: 100%; position: relative; overflow: hidden; }
    .notice-list {
        list-style: none; position: absolute; top: 0; left: 0; width: 100%;
        animation: scrollUp 12s infinite cubic-bezier(0.68, -0.55, 0.27, 1.55);
    }
    .notice-item { height: 24px; line-height: 25px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notice-item a { color: inherit; display: block; width: 100%; }

    /* 内容网格 */
    .content-area { padding: 30px; max-width: 1400px; margin: 0 auto; min-height: calc(100vh - 400px); }
    .section-header {
        font-size: 1.05rem; color: var(--text-sub); margin: 30px 0 15px 0;
        display: flex; align-items: center; font-weight: 600; opacity: 0.9;
    }
    .section-header::before {
        content: "#"; margin-right: 6px; font-weight: 400; font-size: 1.1rem; color: #cbd5e1;
    }
    .grid-box { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }

    /* 底部 */
    .footer {
        text-align: center; padding: 30px 20px 80px 20px; color: var(--text-sub);
        font-size: 0.75rem; line-height: 1.6; opacity: 0.8;
        border-top: 1px dashed var(--border); margin-top: 40px;
    }

    /* ================= 4. 组件：卡片 (整合优化版) ================= */
    .card {
        background: var(--bg-card); border-radius: 8px; padding: 14px;
        display: flex; align-items: center; text-decoration: none;
        color: inherit; transition: all 0.2s; position: relative;
        overflow: hidden; border: 1px solid transparent;
        box-shadow: 0 1px 2px rgba(0,0,0,0.03); cursor: pointer;
    }
    
    /* 仅在支持悬停的设备上启用上浮效果，防止手机端闪烁 */
    @media (hover: hover) { 
        .card:hover {
            transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.06);
            border-color: rgba(59, 130, 246, 0.3);
        }
    }

    .card-img {
        width: 36px; height: 36px; border-radius: 6px;
        background: var(--bg-body); margin-right: 12px; object-fit: cover; flex-shrink: 0;
    }

    /* 卡片信息容器 - Flex 布局控制紧凑间距 */
    .card-info { 
        flex: 1; 
        overflow: hidden; 
        padding-right: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px; /* 核心：行间距 */
    }

    .card-title { 
        font-size: 0.9rem; font-weight: 700; color: var(--text-main); 
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
        margin: 0; line-height: 1.4;
    }

    .card-desc { 
        font-size: 0.75rem; color: var(--text-sub); 
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
        margin: 0; line-height: 1.5;
    }

    /* 作者/标签 - 紧凑样式 */
    .card-tag {
        display: inline-block;
        font-size: 11px;
        padding: 0px 6px;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary);
        font-weight: 500;
        line-height: 1.5;
        width: fit-content;
        margin: 0;
    }

    /* 热度/按钮标识 */
    .card-views {
        position: absolute; top: 6px; right: 8px; font-size: 10px;
        color: #f59e0b; background: rgba(245, 158, 11, 0.1);
        padding: 1px 4px; border-radius: 4px; display: flex; align-items: center; gap: 2px;
    }
    .view-count { font-weight: 600; }

    /* 编辑/删除按钮 (DEV模式) */
    .card-actions { position: absolute; top: 0; right: 0; display: none; z-index: 10; }
    .card:hover .card-actions { display: flex; }
    .action-btn {
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: white; font-size: 12px;
    }
    .btn-edit { background-color: #3b82f6; }
    .btn-del { background-color: #ef4444; border-bottom-left-radius: 6px; }

    /* ================= 5. 组件：Tab 切换器 ================= */
    .tab-container {
        display: flex;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 20px;
        padding: 4px;
        margin-top: 15px;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255,255,255,0.1);
        position: relative;
        z-index: 10;
    }
    
    .tab-btn {
        padding: 6px 24px;
        border-radius: 16px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
    }
    
    .tab-btn.active {
        background: white;
        color: var(--primary);
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    /* ================= 6. 组件：浮动按钮 & 弹窗 ================= */
    .fab-container {
        position: fixed; bottom: 30px; right: 30px;
        display: flex; flex-direction: column; gap: 12px; z-index: 100;
    }
    .fab-btn {
        width: 44px; height: 44px; border-radius: 50%;
        background: var(--bg-card); color: var(--text-sub);
        border: 1px solid var(--border); cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        transition: 0.2s;
    }
    .fab-btn:hover { transform: scale(1.1); color: var(--primary); border-color: var(--primary); }

    /* 通用 Modal */
    .modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: none; justify-content: center; align-items: center;
        z-index: 2000; backdrop-filter: blur(3px);
    }
    .modal-box {
        background: var(--bg-card); width: 90%; max-width: 400px;
        padding: 24px; border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .form-row { margin-bottom: 12px; }
    .form-row label { display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--text-sub); }
    .form-row input, .form-row select {
        width: 100%; padding: 8px 10px;
        background: var(--bg-body); border: 1px solid var(--border);
        color: var(--text-main); border-radius: 6px; font-size: 0.9rem;
    }
    .modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .textarea-export { width: 100%; height: 150px; padding: 10px; background: #1e293b; color: #86efac; border-radius: 6px; font-family: monospace; font-size: 12px; border:none; }

    /* 更新日志 Modal */
    .log-scroll-box {
        max-height: 300px; overflow-y: auto; margin: 10px 0; padding-right: 5px;
    }
    .log-scroll-box::-webkit-scrollbar { width: 4px; }
    .log-scroll-box::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .timeline { border-left: 2px solid var(--border); margin-left: 6px; padding-left: 20px; padding-top: 5px; }
    .timeline-item { position: relative; margin-bottom: 20px; }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-item::before {
        content: ''; position: absolute; left: -27px; top: 5px;
        width: 10px; height: 10px; border-radius: 50%;
        background: var(--bg-card); border: 2px solid var(--primary); z-index: 1;
    }
    .timeline-date {
        font-size: 0.75rem; color: var(--primary); font-weight: 600;
        margin-bottom: 4px; display: inline-block;
        background: rgba(59, 130, 246, 0.1); padding: 1px 6px; border-radius: 4px;
    }
    .timeline-content { font-size: 0.9rem; color: var(--text-main); line-height: 1.5; }

    /* ================= 7. 动画与提示 (Toast) ================= */
    #toast-container {
        position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
        z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    }
    .toast-msg {
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(5px); color: #fff;
        padding: 10px 24px; border-radius: 50px; font-size: 0.9rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px;
		white-space: nowrap;
        opacity: 0; animation: toastIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
    }
    .toast-success i { color: #4ade80; }
    .toast-warn i { color: #facc15; }

    @keyframes toastIn { to { opacity: 1; transform: translateY(0); } }
    @keyframes toastOut { to { opacity: 0; transform: translateY(-20px); } }
    @keyframes scrollUp { 0%, 20% { top: 0; } 25%, 45% { top: -24px; } 50%, 70% { top: -48px; } 75%, 95% { top: -72px; } 100% { top: 0; } }
    @keyframes bellShake { 0%, 100% { transform: rotate(0); } 10%, 30%, 50% { transform: rotate(-15deg); } 20%, 40% { transform: rotate(15deg); } 60% { transform: rotate(0); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin-slow { animation: spin 4s linear infinite; display: inline-block; margin-right: 4px; }

    /* ================= 8. 移动端适配 (优化版) ================= */
    .mobile-header {
        display: none; position: fixed; top: 0; left: 0; right: 0; height: var(--header-h-mobile);
        z-index: 1000; padding: 0 20px; align-items: center; justify-content: space-between;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); color: white; 
    }
    .mobile-header.scrolled {
        background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px); border-bottom: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 4px 20px rgba(0,0,0,0.06); color: var(--text-main);
    }
    [data-theme="dark"] .mobile-header.scrolled {
        background: rgba(31, 41, 55, 0.9); border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--text-main);
    }
    .m-logo-icon { font-size: 1.5rem; display: flex; align-items: center; }
    .m-menu-btn { font-size: 1.5rem; cursor: pointer; }

    /* ★★★ 修改重点在这里 ★★★ */
    @media (max-width: 768px) {
        body { display: block; height: auto; overflow-y: auto; }
        .mobile-header { display: flex; }
        
        .sidebar { 
            position: fixed; left: -100%; height: 100%; top: 0; 
            transform: translateX(0); left: -100%;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 5px 0 15px rgba(0,0,0,0.1); 
        }
        .sidebar.show { left: 0; }
        .main-viewport { height: auto; overflow: visible; }
        
        .banner { 
            /* 顶部避让导航栏 (60px) */
            padding-top: var(--header-h-mobile); 
            height: auto; 
            
            /* 1. 减小最小高度 (原240px -> 180px)，防止强制撑开导致上下空隙过大 */
            min-height: 180px; 
            
            /* 2. 减小底部留白 (原30px -> 15px)，解决Tab离底部太宽的问题 */
            padding-bottom: 15px; 
        }
        
        .banner h1 { 
            font-size: 1.25rem; 
            
            /* 3. 减小标题上边距 (原20px -> 5px)，解决文字离顶部太宽的问题 */
            margin-top: 5px; 
            margin-bottom: 10px; /* 微调标题与搜索框的间距 */
        }
        
        .search-bar input { padding: 8px 15px 8px 40px; font-size: 0.85rem; height: 38px; }
        .search-bar i { font-size: 0.9rem; left: 12px; }
        .content-area { padding: 15px; }
        .grid-box { grid-template-columns: repeat(2, 1fr); gap: 10px; } 
        .card { padding: 10px; flex-direction: column; align-items: flex-start; text-align: left; }
        .card-img { margin-bottom: 8px; width: 32px; height: 32px; }
        #mobileMenuBtn { display: none !important; } 
    }
	/* ================= 环形进度条新增样式 ================= */
	/* 调整置顶按钮，使其支持绝对定位的 SVG */
	#toTopBtn {
		position: relative;
		border: none; /* 去除原有边框，改用 SVG 圆环作为边框视觉 */
		background: var(--bg-card); /* 保持背景色 */
		box-shadow: 0 4px 10px rgba(0,0,0,0.1); /* 保持阴影 */
		padding: 0; /* 清除内边距 */
		overflow: visible; /* 允许SVG稍微溢出一点（如果有需要） */
	}

	/* 进度条 SVG 容器，旋转 -90度 是为了让进度从正上方开始 */
	.progress-ring {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
		pointer-events: none; /* 让点击事件穿透 SVG 作用于按钮 */
	}

	/* 圆环的背景轨道（灰色/浅色圆圈） */
	.progress-ring__bg {
		stroke: var(--border); /* 使用你定义的边框颜色变量 */
		transition: stroke 0.3s;
	}

	/* 蓝色的进度条圆圈 */
	.progress-ring__circle {
		stroke: var(--primary); /* 使用你定义的主题蓝色 */
		transition: stroke-dashoffset 0.1s linear; /* 丝滑动画 */
		transform-origin: 50% 50%;
		stroke-linecap: round; /* 圆头看起来更精致 */
	}

	/* 调整原来的图标层级，确保在圆环上面 */
	#toTopBtn i {
		position: relative;
		z-index: 2;
	}
</style>
</head>
<body>
    
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <div id="toast-container"></div>
    <header class="mobile-header" id="mobileHeader">
        <a href="https://ddgksf2013.top" class="m-logo-icon">
            <i class="fas fa-globe"></i>
        </a>
        <div class="m-menu-btn" onclick="toggleSidebar()">
            <i class="ri-menu-line"></i>
        </div>
    </header>

    <aside class="sidebar" id="sidebar">
        <a href="https://ddgksf2013.top" class="logo">
            <i class="fas fa-globe" style="font-size: 24px; vertical-align: middle;"></i>
            墨魚手記
        </a>

        <div class="nav-menu" id="navMenu"></div>

        <div class="sidebar-footer" id="prodFooter" style="display: none;">
            <div class="run-time" id="runTime">运行时间计算中...</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="app-version">v1.9</span>
                <span>&copy; 2025</span>
            </div>
        </div>

        <div class="dev-tools" id="devTools" style="display: none;">
            <button class="btn-tool btn-primary" onclick="openAddModal()">
                <i class="ri-add-line"></i> 添加网站/分类
            </button>
            <button class="btn-tool" onclick="openExportModal()">
                <i class="ri-code-box-line"></i> 导出配置
            </button>
        </div>
    </aside>

    <main class="main-viewport" id="mainViewport">
        <div class="banner">
            <h1>ddgksf2013's 收藏夹</h1>
            <div class="search-container">
                <div class="search-bar">
                    <i class="ri-search-line"></i>
                    <input type="text" id="searchInput" placeholder="搜索内容...">
                </div>
                <div class="notice-bar">
                    <i class="ri-notification-3-line notice-icon"></i>
                    <div class="notice-content">
                        <ul class="notice-list" id="noticeList"></ul>
                    </div>
                </div>
                <div style="display: flex; justify-content: center;">
                    <div class="tab-container">
                        <button class="tab-btn active" onclick="switchTab('nav')" id="tab-nav">
                            <i class="fas fa-globe"></i> WebIndex
                        </button>
                        <button class="tab-btn" onclick="switchTab('qx')" id="tab-qx">
                            <i class="ri-sun-line"></i> QuantumultX
                        </button>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="content-area" id="contentArea"></div>
        
        <footer class="footer">
            <p>版权所有 &copy; 2025 <span class="clickable" onclick="window.open('https://t.me/ddgksf2013', '_blank')">ddgksf2013</span> All rights reserved.</p>
            <p>内容来源于互联网，如有侵权，请联系删除。</p>
            <p id="busuanzi_container_site_pv" style="display:none">
                <i class="ri-eye-line" style="vertical-align: middle; margin-right: 4px;"></i>
                本站总访问量 <span id="busuanzi_value_site_pv"></span> 次
            </p>
        </footer>

        <script async src="https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.15.0/dist/av-min.js"></script>

    </main>

    <div class="fab-container">
        <button class="fab-btn" onclick="openLogModal()"><i class="ri-history-line"></i></button>
        <button class="fab-btn" onclick="toggleTheme()"><i class="ri-moon-line" id="themeIcon"></i></button>
        <button class="fab-btn" onclick="scrollToTop()" id="toTopBtn">
			<svg class="progress-ring" width="44" height="44">
				<circle class="progress-ring__bg" stroke-width="2" fill="transparent" r="20" cx="22" cy="22"/>
				<circle class="progress-ring__circle" stroke-width="2" fill="transparent" r="20" cx="22" cy="22"/>
			</svg>
			<i class="ri-arrow-up-line"></i>
		</button>
        <button class="fab-btn" onclick="toggleSidebar()" style="display: none;" id="mobileMenuBtn"><i class="ri-menu-line"></i></button>
    </div>

    <div class="modal-overlay" id="editModal">
        <div class="modal-box">
            <h3 id="modalTitle" style="margin-bottom: 15px; color: var(--text-main);">添加资源</h3>
            <form onsubmit="saveItem(event)">
                <div class="form-row" id="catGroup">
                    <div style="display: flex; justify-content: space-between;">
                        <label>选择分类</label>
                        <span style="font-size: 12px; color: var(--primary); cursor: pointer;" onclick="toggleNewCat()" id="catToggleText">新建?</span>
                    </div>
                    <select id="catSelect"></select>
                    <input type="text" id="newCatInput" placeholder="输入新分类名称" style="display: none;">
                </div>
                <div class="form-row">
                    <label>网站名称</label>
                    <input type="text" id="itemName" required>
                </div>
                <div class="form-row">
                    <label>网址 (URL)</label>
                    <input type="url" id="itemUrl" required placeholder="https://">
                </div>
                <div class="form-row">
                    <label>自定义图标 (选填)</label>
                    <input type="url" id="itemIcon" placeholder="图标图片地址，留空则自动获取">
                </div>
                <div class="form-row">
                    <label>描述 (选填)</label>
                    <input type="text" id="itemDesc">
                </div>
                <div class="modal-btns">
                    <button type="button" class="btn-tool" style="width:auto;" onclick="closeModal('editModal')">取消</button>
                    <button type="submit" class="btn-tool btn-primary" style="width:auto;">保存</button>
                </div>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="exportModal">
        <div class="modal-box">
            <h3>数据导出</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">复制下方代码覆盖 HTML 中的 initialData</p>
            <textarea class="textarea-export" id="exportArea" readonly></textarea>
            <div class="modal-btns">
                <button type="button" class="btn-tool" style="width:auto;" onclick="closeModal('exportModal')">关闭</button>
                <button type="button" class="btn-tool btn-primary" style="width:auto;" onclick="copyCode()">复制</button>
            </div>
        </div>
    </div>
    <div class="modal-overlay" id="logModal">
        <div class="modal-box">
            <h3 style="color: var(--text-main); margin-bottom: 10px;">
                <i class="ri-history-line" style="color: var(--primary); margin-right:5px;"></i>更新日志
            </h3>
            <div class="log-scroll-box" id="logContent">
                </div>
            <div class="modal-btns">
                <button type="button" class="btn-tool btn-primary" style="width:auto;" onclick="closeModal('logModal')">关闭</button>
            </div>
        </div>
    </div>
    <script>
        // ================= CONFIG =================
        const MODE = 'PROD'; // 'DEV' or 'PROD'
        const REF_CODE = 'ref=ddgksf2013.top';
        const BANNER_IMG = 'https://ddgksf2013.top/bg.jpg';
        const START_DATE = '2025-11-23';
        const LC_APP_ID = 'WTPUNkqlclvZYQ48SKK0eTrp-MdYXbMMI'; 
        const LC_APP_KEY = 'nMf4Hd4p1JsKmHkH6PjCV5GJ';
        const LC_SERVER_URL = 'https://wtpunkql.api.lncldglobal.com';

		// 日志数据配置
        const CHANGE_LOGS = [
			{ date: '2025-12-15', content: '添加开源安卓软件、安卓TV软件索引。' },
			{ date: '2025-12-11', content: '添加苹果商店应用比价、独播库索引。' },
			{ date: '2025-12-09', content: '添加果果地和猫猫库。' },
			{ date: '2025-12-06', content: '新增歌单迁移、tg视频下载工具索引。' },
			{ date: '2025-12-05', content: '回到置顶按钮外圈可以实时显示浏览比例，微调提示样式。' },
			{ date: '2025-12-04', content: '修复部分卡片点击热度不增加BUG，修改配置和分流提示样式。' },
            { date: '2025-12-02', content: '新增CSDN解锁，添加若干重写、分流和图标订阅，优化更新日志弹窗显示。' },
            { date: '2025-11-30', content: '优化搜索结果显示；新增QX Tab栏，并增加配置和会员解锁部分，其余内容，后面空余时间添加。' },
            { date: '2025-11-29', content: '新增页面右下角更新日志悬浮按钮，修复手机端点击卡片闪屏问题；优化跳转体验。' },
            { date: '2025-11-28', content: '新增Codebox索引。' },
            { date: '2025-11-27', content: '输入“芝麻开门”可开启隐藏模式。' },
            { date: '2025-11-26', content: '增加卡片热度点击显示。' },
            { date: '2025-11-24', content: '导航栏加入了图标，新增 8 个资源，让整体体验更顺畅。' },
            { date: '2025-11-23', content: '墨鱼索引 v1.1 上线，支持夜间模式与响应式布局。' }
        ];
		        
        const NOTICES = [
            { text: "欢迎访问墨鱼索引，更新日期2025-12-21..", url: "https://ddgksf2013.top" },
            { text: "请勿在CN境内公开宣传本站，谢谢合作！", url: "#" },
            { text: "手机端已优化，支持下拉刷新体验！", url: "#" },
            { text: "点击右上角菜单查看更多分类。", url: "#" },
            { text: "如有失效链接，请联系 ddgksf2013 反馈。", url: "https://t.me/ddgksf2013" }
        ];
		
        // 分类图标映射
        const CAT_ICONS = {
			"プロモーション": "ri-megaphone-line",
            "自用推荐": "ri-star-line",
            "影视网站": "ri-movie-2-line",
            "动漫番剧": "ri-bilibili-line",
            "资源下载": "ri-download-cloud-2-line",
            "工具相关": "ri-tools-line",
            "尽享阅读": "ri-book-read-line",
            "音乐视界": "ri-headphone-line",
            "隐藏分类": "ri-eye-off-line",
            "联系我们": "ri-customer-service-2-line",
            "默认": "ri-folder-line"
        };
        const initialData = [
			{
                "category": "プロモーション",
                "items": [
					{ "name": "支付宝消费红包", "url": "https://shrtm.nu/nQc", "desc": "每日可领", "icon": "https://img.88icon.com/download/jpg/20200731/7dc2b96fbd8b8ddf4c0193e02ae10be7_512_512.jpg" },
					{ "name": "自用IPLC机场", "url": "https://webinv02.sc-aff.cc/auth/register?code=AeyhVB1R", "desc": "月付勿年付，80sc享八折", "icon": "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/f1/0e/c6/f10ec606-2e57-aedc-3bcb-63917d07823c/AppIcon-0-1x_U007epad-0-11-0-0-85-220-0.png/120x120bb.jpg" },
					//{ "name": "财新数据通", "url": "https://ddgksf2013.t.me", "desc": "实时新闻，频道RSS阅读", "icon": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/41/ec/78/41ec78e7-d13b-26a4-af5e-58eaffdef30c/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/100x100bb.jpg" },
					{ "name": "TG万能搜", "url": "https://t.me/jisou?start=a_840533234", "desc": "帮你找到有趣的内容", "icon": "https://t.me/i/userpic/160/jisou.jpg" }
				]
            },
            {
                "category": "资源推荐",
                "items": [
                    { "name": "Cuttlefish's Github", "url": "https://github.com/ddgksf2013", "desc": "墨鱼去广告规则", "icon": "https://avatars.githubusercontent.com/u/116851128?v=4" },
                    { "name": "Cuttlefishの自留地", "url": "https://t.me/ddgksf2021", "desc": "资讯发布首选地", "icon": "https://t.me/i/userpic/160/ddgksf2021.jpg" },
                    { "name": "Cuttlefishの网盘地", "url": "https://t.me/ddgksf2023", "desc": "破解💎IPA、实用APK", "icon": "https://t.me/i/userpic/160/ddgksf2023.jpg" },
                    { "name": "自用好物", "url": "https://ddgksf2013.top/goods/", "desc": "提升日常小幸福感", "icon": "https://assets.tw.my-best.com/_next/static/media/favicon.f2271dce.ico" }
                    
                ]
            },
            {
                "category": "影视网站",
                "items": [
                    { "name": "Libvio", "url": "https://www.libvio.site", "desc": "海外居多", "icon": "" },
                    { "name": "剧迷", "url": "https://gimy.tv/", "desc": "影视，小而美", "icon": "" },
					{ "name": "独播库", "url": "https://www.dbku.tv/", "desc": "老牌影视站", "icon": "" },
                    { "name": "厂长资源", "url": "https://www.czzy.site/", "desc": "质量1080P", "icon": "https://gimg3.baidu.com/gimg/app=2028&src=cdn.4001010.xyz/website/20250607-1/2540f02db62a1d19f15b5428a4667d9d.png" },
                    { "name": "NO视频", "url": "https://www.novipnoad.net/", "desc": "种类会多些" },
                    { "name": "在线之家", "url": "https://www.zxzjhd.com/", "desc": "老牌知名影视网站", "icon": "" },
                    { "name": "磁力熊", "url": "https://www.cilixiong.cc/", "desc": "纯净的1080P高分电影网站", "icon": "" }
                ]
            },
            {
                "category": "动漫番剧",
                "items": [
                    { "name": "Anime1 ", "url": "https://anime1.me/", "desc": "界面简洁、更新速度快", "icon": "" },
                    { "name": "girigiri爱动漫", "url": "https://anime.girigirilove.icu/", "desc": "日番、美番为主", "icon": "" },
                    { "name": "Ebb", "url": "https://ebb.io/", "desc": "在线动漫，可备用" }
                ]
            },
            {
                "category": "资源下载",
                "items": [
					
                    { "name": "磁力搜索", "url": "https://xn--0tr952eyzisl5a.com/", "desc": "猫和老鼠" },
                    { "name": "动漫花园", "url": "https://share.dmhy.org/", "desc": "动漫下载", "icon": "https://share.dmhy.org/favicon.ico" },
                    { "name": "Nyaa", "url": "https://nyaa.ink/", "desc": "番剧著名站" },
                    { "name": "Wallhaven", "url": "https://wallhaven.cc/", "desc": "自用壁纸下载" },
                    { "name": "音范丝", "url": "https://www.yinfans.me/", "desc": "原盘下载" },
                    { "name": "z-library", "url": "https://zlib.re", "desc": "它是第二，没谁第一", "icon": "" },
                    { "name": "推特视频下载", "url": "https://twitterxz.com/", "desc": "临时使用", "icon": "" },
                    { "name": "IOS图标", "url": "https://icon.yukonga.top/", "desc": "一键下载图标", "icon": "" },
                    { "name": "iPhone壁纸", "url": "https://applewalls.com/", "desc": "原图无损无水印", "icon": "" },
					{ "name": "电报视频下载", "url": "https://chromewebstore.google.com/detail/telegram-video-downloader/kljkjamilbfohkmbacbdongkddmoliag", "desc": "下载受限频道内容", "icon": "https://crxdl.com//icon/p/pnekmfnjbjaddedaednmgegopfcekael_icon.jpg" },
					{ "name": "安卓手机软件", "url": "https://github.com/xlucn/oh-my-foss-android", "desc": "实用开源APK","icon": "https://avatars.githubusercontent.com/u/12032219?v=4"},
					{ "name": "安卓TV软件", "url": "https://github.com/youhunwl/TVAPP", "desc": "看电视，一站式搞定","icon": "https://avatars.githubusercontent.com/u/30980738?v=4"}
                ]
            },
            {
                "category": "工具相关",
                "items": [
                    { "name": "Pixiv", "url": "https://m.pixivic.com/dailyRank", "desc": "每日排行" },
                    { "name": "PDF处理", "url": "https://smallpdf.com/", "desc": "很全面" },
                    { "name": "白描网页", "url": "https://web.baimiaoapp.com/", "desc": "工具" },
                    { "name": "图片放大", "url": "http://waifu2x.udp.jp/", "desc": "waifu" },
                    { "name": "照片去背景", "url": "https://www.remove.bg/zh", "desc": "小巧实用", "icon": "" },
                    { "name": "Charles激活码", "url": "https://www.zzzmode.com/mytools/charles/", "desc": "白嫖谁不爱呢", "icon": "" },
                    { "name": "EmbyTool", "url": "https://github.com/ddgksf2013/EmbyToolbox", "desc": "看Emby，工具是基石", "icon": "https://emby.media/favicon.ico" },
                    { "name": "IOS推荐", "url": "https://appraven.net/collection/37743082", "desc": "收集的优秀IOS应用", "icon": "" },
                    { "name": "Codebox", "url": "https://chromewebstore.google.com/detail/codebox-one-click-code-co/acnnhjllgegbndgknlliobjlekgilbdf", "desc": "一键复制代码/下载文章", "icon": "https://lh3.googleusercontent.com/mNOAmwRS6XDbwgMGfTEYdtoo4iXynfT46xfYB7j8CXPW7sKSYL-SRKfgxd_U4GrZWL-ZIBl58WVuii65466G93gZ5bQ=s120" },
                    { "name": "CSDN文章解锁", "url": "https://csdn.zeroai.chat/", "desc": "偶尔使用下","icon": "https://g.csdnimg.cn/static/logo/favicon32.ico"},
					{ "name": "歌单迁移", "url": "https://music.unmeta.cn/", "desc": "网易云|汽水|QQ音乐", "icon": "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/8a/93/a4/8a93a4c9-784b-6de9-925e-f7dd4ca21002/AppIcon-0-0-1x_U007epad-0-1-85-220.png/100x100bb.jpg" },
					{ "name": "AppStore价格查询", "url": "https://app.vbr.me/", "desc": "探索全球应用定价","icon": ""},
					{ "name": "IOS屏蔽更新", "url": "https://d-updater.i4.cn/web/mobileconfig/iOS18.mobileconfig", "desc": "描述性文件","icon": "https://cdsassets.apple.com/live/7WUAS350/images/ios/ios-26-badge-icon.png"}
                ]
            },
            {
                "category": "尽享阅读",
                "items": [
                    { "name": "知性教育", "url": "https://knowsex.net/", "desc": "性教育" },
                    { "name": "我不是盐神", "url": "https://onehu.xyz/", "desc": "免费阅读盐选文章", "icon": "" },
                    { "name": "小火箭使用教程", "url": "https://lowertop.github.io/Shadowrocket/", "desc": "太详细了", "icon": "https://www.shadowrocket.vip/wp-content/uploads/2022/12/logo_400x400-150x150.jpg" }
                ]
            },
            {
                "category": "音乐视界",
                "items": [
                    { "name": "Lofi", "url": "https://www.lofi.cafe/", "desc": "学习娱乐背景音乐", "icon": "" },
                    { "name": "Hifi", "url": "https://www.hifiti.com/", "desc": "音乐下载的论坛", "icon": "" }
                ]
            },
            {
                "category": "联系我们",
                "items": [
                    { "name": "TG联系", "url": "https://t.me/ddgksf2013", "desc": "建议|投稿|广告|合作", "icon": "https://t.me/i/userpic/160/ddgksf2013.jpg" }
                ]
            }
        ];
        // ================= QX 数据源 =================
        let qxData = [];
        // ================= LOGIC =================
        let db = [];
        let globalViews = {}; 
        let editState = null;
        let isNewCat = false;
        
        // --- 隐藏分类逻辑 START ---
        // 1. 定义加密数据
        const secretData = {
            category: "隐藏分类",
            items: [
                { name: "桃花族", enc_url: "Ew8PC0FUVA8TAQ5VGBhU", desc: "论坛" },
                { name: "Jable", enc_url: "Ew8PCwhBVFQRGhkXHlUPDVQ=", desc: "老司机说车开了" },
                { name: "Missav", enc_url: "Ew8PCwhBVFQWEggIGg1VGhJU", desc: "中等偏上", icon: "" },
                { name: "Netflav", enc_url: "Ew8PCwhBVFQVHg8dFxoNVRgUFlQ=", desc: "AV界奈飞" },
                { name: "禁漫天堂", enc_url: "Ew8PCwhBVFRKQxgUFhIYVQ0SC1Q=", desc: "在线本子，18+韩漫", icon: "" },
                { name: "肉漫", enc_url: "Ew8PCwhBVFQJFA4WGhVOVRgUFlQ=", desc: "字如其名" },
				{ name: "ASMR", enc_url: "Ew8PCwhBVFQMDAxVGggWCVUUFR5U", desc: "酥酥的感觉", icon: "https://cdn-icons-png.freepik.com/512/2040/2040933.png" }
            ]
        };

        // 2. 解密函数
        function safeDecode(str) {
            try {
                const key = 123; 
                const decoded = window.atob(str);
                let result = "";
                for (let i = 0; i < decoded.length; i++) {
                    result += String.fromCharCode(decoded.charCodeAt(i) ^ key);
                }
                return result;
            } catch (e) {
                console.error("解密失败", e);
                return "";
            }
        }

        // 3. 开启隐藏模式 (芝麻开门)
        function unlockSecret() {
            const exists = db.some(cat => cat.category === secretData.category);
            if (exists) {
                showToast("隐藏模式已处于开启状态", "warn");
                return;
            }

            const decodedItems = secretData.items.map(item => ({
                name: item.name,
                url: safeDecode(item.enc_url),
                desc: item.desc,
                icon: item.icon || ""
            }));

            const newCategory = {
                category: secretData.category,
                items: decodedItems
            };

            // 插入到 "联系我们" 之前
            const contactIndex = db.findIndex(cat => cat.category === "联系我们");
            let targetIndex = db.length;

            if (contactIndex !== -1) {
                db.splice(contactIndex, 0, newCategory);
                targetIndex = contactIndex;
            } else {
                db.push(newCategory);
                targetIndex = db.length - 1;
            }

            renderPage();
            showToast("芝麻开门！隐藏模式已激活", "success");
            
            // ★★★ 关键修改：延时 600ms 等待手机键盘收起后再滚动 ★★★
            setTimeout(() => {
                const el = document.getElementById(`cat-${targetIndex}`);
                if(el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 400);
        }

        // 4. 关闭隐藏模式 (芝麻关门)
        function lockSecret() {
            const idx = db.findIndex(cat => cat.category === secretData.category);
            
            if (idx !== -1) {
                db.splice(idx, 1);
                renderPage();
                showToast("芝麻关门！隐藏模式已关闭", "success");
            } else {
                showToast("隐藏模式目前未开启", "warn");
            }
        }

        // 5. 搜索框监听 (核心触发逻辑 + 手机键盘优化)
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const val = e.target.value;
            
            // --- 开启暗号 ---
            if (val === "芝麻开门") {
                e.target.blur(); // ★ 主动收起手机键盘
                e.target.value = ""; 
                triggerSearchInput(""); 
                unlockSecret();
                return;
            }

            // --- 关闭暗号 ---
            if (val === "芝麻关门") {
                e.target.blur(); // ★ 主动收起手机键盘
                lockSecret();
                e.target.value = ""; 
                triggerSearchInput("");
                return;
            }

            // --- 普通搜索逻辑 ---
            triggerSearchInput(val);
        });

        // 辅助函数：手动触发搜索筛选
        function triggerSearchInput(val) {
            const lowerVal = val.toLowerCase();
            
            // 第一步：先筛选并控制每个“卡片”的显隐
            document.querySelectorAll('.card').forEach(el => {
                if (!el) return;
                const text = el.innerText.toLowerCase();
                // 只要匹配，就显示(flex)，不匹配就隐藏(none)
                el.style.display = text.includes(lowerVal) ? 'flex' : 'none';
            });

            // 第二步：遍历所有“分类”，如果该分类下没有可见卡片，则隐藏整个分类
            // 我们利用 db 数据来遍历对应的 DOM ID (cat-0, cat-1...)
            db.forEach((_, idx) => {
                const catSection = document.getElementById(`cat-${idx}`);
                if(catSection) {
                    // 在该分类容器内，查找是否有任何 display 不为 'none' 的卡片
                    // 这里使用 Array.from 是为了兼容性，也可以用简单的 for 循环
                    const hasVisibleCards = Array.from(catSection.querySelectorAll('.card')).some(card => {
                        return card.style.display !== 'none';
                    });
                    
                    // 如果有可见卡片，显示整个分类区域；否则隐藏
                    catSection.style.display = hasVisibleCards ? 'block' : 'none';
                }
            });
        }
        // --- 隐藏分类逻辑 END ---

        // 初始化 LeanCloud
        function initLeanCloud() {
            if (typeof AV === 'undefined') return;
            // 只有当填写了真实的 ID 时才初始化
            if (LC_APP_ID === 'YOUR_APP_ID') {
                console.warn('LeanCloud AppID 未填写，热度统计功能暂不可用');
                return;
            }
            AV.init({
                appId: LC_APP_ID,
                appKey: LC_APP_KEY,
                serverURLs: LC_SERVER_URL
            });
        }

        // --- 自定义提示框函数 ---
        function showToast(msg, type = 'success') {
            const container = document.getElementById('toast-container');
            const el = document.createElement('div');
            
            // 根据类型选择图标
            let icon = 'ri-checkbox-circle-line';
            if(type === 'warn') icon = 'ri-error-warning-line';
            
            el.className = `toast-msg toast-${type}`;
            el.innerHTML = `<i class="${icon}"></i> <span>${msg}</span>`;
            
            container.appendChild(el);

            // 3秒后自动移除
            setTimeout(() => {
                el.style.animation = 'toastOut 0.3s forwards';
                el.addEventListener('animationend', () => el.remove());
            }, 3000);
        }
		// ================= 环形进度条逻辑 =================
		const circle = document.querySelector('.progress-ring__circle');
		// 半径 r=20, 周长 = 2 * PI * r
		const radius = circle.r.baseVal.value;
		const circumference = radius * 2 * Math.PI;

		// 初始化设置：将虚线长度设置为周长，这样 dashoffset 等于周长时就完全隐藏
		circle.style.strokeDasharray = `${circumference} ${circumference}`;
		circle.style.strokeDashoffset = circumference;

		// 更新进度的函数
		function setProgress(percent) {
			// percent 是 0 到 1 之间的小数
			const offset = circumference - percent * circumference;
			circle.style.strokeDashoffset = offset;
		}
        function init() {
            initLeanCloud();

            //if(BANNER_IMG) {
            //    document.querySelector('.banner').style.backgroundImage = `url('${BANNER_IMG}')`;
            //}
            
            if(MODE === 'DEV') {
                document.getElementById('devTools').style.display = 'block';
                const local = localStorage.getItem('navDB_v5');
                db = local ? JSON.parse(local) : initialData;
                if(!local) saveDB();
            } else {
                db = initialData;
                document.getElementById('prodFooter').style.display = 'block';
                updateRunTime();
                setInterval(updateRunTime, 1000);
            }
            
            renderPage(); // 2. 渲染页面结构
            renderNotices();
            fetchGlobalViews(); // 3. 异步获取热度
            
            if(localStorage.getItem('theme') === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                document.getElementById('themeIcon').className = 'ri-sun-line';
            }
        }

        // --- 核心逻辑：从云端获取点击量 ---
        function fetchGlobalViews() {
            if (LC_APP_ID === 'YOUR_APP_ID') return;
            const query = new AV.Query('Counter');
            query.limit(1000); 
            query.find().then((results) => {
                // 1. 先把数据存进全局缓存
                results.forEach(item => {
                    globalViews[item.get('url')] = item.get('views');
                });
                // 2. 再更新页面上的数字
                updateDomViews();
            }).catch((error) => console.error(error));
        }

        // 辅助函数：利用缓存刷新页面显示的数字
        function updateDomViews() {
            document.querySelectorAll('.view-count').forEach(span => {
                const url = span.getAttribute('data-url');
                // 如果缓存里有数据，就显示；没有则保持默认
                if (globalViews[url]) {
                    span.innerText = globalViews[url];
                }
            });
        }

        // --- 核心逻辑：点击上报云端 ---
        function trackClick(url) {
            //const finalUrl = url + (url.includes('?') ? '&' : '?') + REF_CODE;
            //window.open(finalUrl, '_blank');

            // --- 下面只保留统计逻辑 ---
            if (LC_APP_ID === 'YOUR_APP_ID') return;

            // 更新页面显示的数字 (缓存)
            const spans = document.querySelectorAll(`.view-count[data-url="${url}"]`);
            spans.forEach(s => {
                let n = parseInt(s.innerText) || 0;
                n++;
                s.innerText = n;
                globalViews[url] = n; 
            });

            // 发送云端请求
            const query = new AV.Query('Counter');
            query.equalTo('url', url);
            query.first().then((counter) => {
                if (counter) {
                    counter.increment('views', 1);
                    counter.save();
                } else {
                    const newCounter = new AV.Object('Counter');
                    newCounter.set('url', url);
                    newCounter.set('views', 1);
                    newCounter.save();
                }
            }).catch(e => console.log('上报失败', e));
        }

        function updateRunTime() {
            const start = new Date(START_DATE);
            const now = new Date();
            const diff = now - start+8*60*60*1000;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            document.getElementById('runTime').innerText = `已稳定运行 ${days}天 ${hours}时 ${minutes}分 ${seconds}秒`;
        }

        function renderNotices() {
            const list = document.getElementById('noticeList');
            const itemsHtml = NOTICES.map(item => 
                `<li class="notice-item">
                    <a href="${item.url}" target="_blank">${item.text}</a>
                </li>`
            ).join('');
            list.innerHTML = itemsHtml + itemsHtml;
        }

        function saveDB() {
            if(MODE === 'DEV') localStorage.setItem('navDB_v5', JSON.stringify(db));
        }
        // 当前模式：'nav' 或 'qx'
        let currentMode = 'nav'; 

        // 切换 Tab
        // 切换 Tab (支持异步加载)
        function switchTab(mode) {
            currentMode = mode;
            
            // 1. 更新按钮样式
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(`tab-${mode}`).classList.add('active');
            
            // 2. 切换数据源逻辑
            if (mode === 'nav') {
                // --- 导航模式 ---
                db = (MODE === 'DEV' && localStorage.getItem('navDB_v5')) ? JSON.parse(localStorage.getItem('navDB_v5')) : initialData;
                document.getElementById('searchInput').placeholder = "搜索网站...";
                document.getElementById('searchInput').value = ""; // 清空搜索框
                renderPage();
                resetScroll();
            } else {
                // --- QX 模式 ---
                document.getElementById('searchInput').placeholder = "搜索脚本...";
                document.getElementById('searchInput').value = ""; // 清空搜索框
                
                // 检查是否已经加载过数据
                if (qxData.length > 0) {
                    db = qxData;
                    renderPage();
                    resetScroll();
                } else {
                    // 第一次切换，通过 fetch 加载 data.json
                    fetch('./data.json')
                        .then(response => {
                            if (!response.ok) throw new Error("加载失败");
                            return response.json();
                        })
                        .then(data => {
                            qxData = data; // 存入缓存
                            db = qxData;   // 切换当前数据源
                            renderPage();  // 渲染页面
                            resetScroll();
                            showToast('脚本加载成功', 'success');
                        })
                        .catch(err => {
                            console.error(err);
                            showToast('无法加载 data.json，请检查路径', 'warn');
                        });
                }
            }
        }

        // 辅助函数：重置滚动条
        function resetScroll() {
            if(window.innerWidth < 768) window.scrollTo({top: 0, behavior: 'smooth'});
            else document.getElementById('mainViewport').scrollTo({top:0}); 
        }
		// === 新增：复制并提示的辅助函数 ===
		function copyLinkAndNotify(url) {
			// 创建临时输入框用于复制
			const input = document.createElement('textarea');
			input.value = url;
			document.body.appendChild(input);
			input.select();
			try {
				document.execCommand('copy');
				showToast('已复制链接到剪贴板', 'success'); // 复用你现有的 showToast
			} catch (e) {
				showToast('复制失败，请手动复制', 'warn');
			}
			document.body.removeChild(input);
		}
        // 增加第二个参数 type，由外层传入
		function generateQxLink(item, type, gory) {
			const author = item.author || "ddgksf2013";
			const fullTag = item.author ? `${item.name}${gory}@${item.author}` : item.name;
			const opt = item.opt_parser ? item.opt_parser : "false"; 
			
			// 确保 type 存在，默认为 "2" (重写)
			const safeType = type || "2";

			// --- 情况 1：整份配置文件 (Config) ---
			if (safeType === "1") {
				const encodedUrl = encodeURIComponent(item.url);
				// return `quantumult-x:///update-configuration?remote-resource=${encodedUrl}`;
				
				// ★★★ 修改点 1：Config 模式下，不返回 url，而是调用复制函数 ★★★
				return `javascript:copyLinkAndNotify('${item.url}')`;
			}

			// --- 情况 2 & 3：构造 JSON Payload ---
			const iconUrl = item.icon || "https://raw.githubusercontent.com/ddgksf2013/Rewrite/master/Icon/Default.png";
			
			// 构造通用配置字符串
			const configStr = `${item.url}, tag=${fullTag}, update-interval=86400, opt-parser=${opt}, enabled=true`;
			
			let jsonPayload = {};

			if (safeType === "2") {
				// 2 = 重写 (Rewrite)
				// 保持原样，因为这个是需要跳转到 QX APP 的
				jsonPayload = { "rewrite_remote": [ configStr ] };
				const encodedPayload = encodeURIComponent(JSON.stringify(jsonPayload));
				return `https://quantumult.app/x/open-app/add-resource?remote-resource=${encodedPayload}`;
			} else if (safeType === "3") {
				return `javascript:copyLinkAndNotify('${item.url}')`;
				//
			}else if (safeType === "4") {
				jsonPayload = [item.url];;
				const encodedPayload = encodeURIComponent(JSON.stringify(jsonPayload));
				// ★★★ 修改点 2：Filter 模式下，复制链接 ★★★
				return `https://quantumult.app/x/open-app/ui?module=gallery&type=icon&action=add&content=${encodedPayload}`;
			}
			
			// ★★★ 修改点 3：默认兜底情况，复制链接 ★★★
			return `javascript:copyLinkAndNotify('${item.url}')`;
		}

        // 修改后的 renderPage (样式统一版：右上角均为热度)
        function renderPage() {
            const nav = document.getElementById('navMenu');
            const main = document.getElementById('contentArea');
            const catSelect = document.getElementById('catSelect'); 

            let navHtml = '';
            let mainHtml = '';
            let selectHtml = '';

            db.forEach((cat, idx) => {
                let defaultIcon = currentMode === 'nav' ? "ri-folder-line" : "ri-code-box-line";
                const iconClass = CAT_ICONS[cat.category] || defaultIcon;
                
                const currentCatType = cat.catetype || "2";
                const currentCatgory = cat.category;
                
                navHtml += `<div class="nav-item" onclick="scrollToCat(${idx})" id="nav-${idx}">
                                <i class="${iconClass}"></i> ${cat.category}
                            </div>`;
                
                mainHtml += `
                    <div id="cat-${idx}" style="scroll-margin-top: 80px;">
                        <div class="section-header">${cat.category}</div>
                        <div class="grid-box">
                            ${cat.items.map((item, iIdx) => {
                                // 1. 链接与图标逻辑
                                let finalUrl = '';
                                let iconSrc = '';
                                
                                if (currentMode === 'nav') {
                                    iconSrc = item.icon ? item.icon : `https://www.google.com/s2/favicons?domain=${item.url}&sz=64`;
                                    finalUrl = item.url + (item.url.includes('?') ? '&' : '?') + REF_CODE;
                                } else {
                                    // QX 模式
                                    iconSrc = item.icon || "";
                                    finalUrl = generateQxLink(item, currentCatType, currentCatgory);
                                }

                                // 2. 获取热度缓存
                                const viewNum = globalViews[item.url] || '...';
                                
                                return `
                                <a href="${finalUrl}" ${currentMode === 'nav' ? 'target="_blank"' : ''} class="card" onclick="trackClick('${item.url}')">
                                    <img src="${iconSrc}" class="card-img" onerror="this.src='https://via.placeholder.com/40?text=Go'">
                                    
                                    <div class="card-info">
                                        <div class="card-title">${item.name}</div>
                                        
                                        ${currentMode === 'qx' ? `<div class="card-tag">${item.author || 'ddgksf2013'}</div>` : ''}
                                        
                                        <div class="card-desc">${item.desc || '暂无描述'}</div>
                                    </div>
                                    
                                    <div class="card-views">
                                        <i class="ri-fire-line"></i> 
                                        <span class="view-count" data-url="${item.url}">${viewNum}</span>
                                    </div>

                                    ${MODE === 'DEV' ? `
                                    <div class="card-actions">
                                        <div class="action-btn btn-edit" onclick="openEditModal(${idx}, ${iIdx}, event)"><i class="ri-pencil-line"></i></div>
                                        <div class="action-btn btn-del" onclick="delItem(${idx}, ${iIdx}, event)"><i class="ri-close-line"></i></div>
                                    </div>` : ''}
                                </a>
                            `}).join('')}
                        </div>
                    </div>
                `;
                if(catSelect) selectHtml += `<option value="${idx}">${cat.category}</option>`;
            });

            nav.innerHTML = navHtml;
            main.innerHTML = mainHtml;
            if(catSelect) catSelect.innerHTML = selectHtml;
            
            // 每次渲染后都刷新一下视图数字
            updateDomViews();
        }

        const isMobile = window.innerWidth < 768;
        const scrollTarget = isMobile ? window : document.getElementById('mainViewport');
        const mobileHeader = document.getElementById('mobileHeader');

		scrollTarget.addEventListener('scroll', () => {
			let ticking = false; // 标记是否正在处理动画帧

			const updateProgress = () => {
				// 1. 获取 DOM 元素
				let scrollTop, scrollHeight, clientHeight;
				
				if (isMobile) {
					scrollTop = window.scrollY || document.documentElement.scrollTop;
					scrollHeight = document.documentElement.scrollHeight;
					clientHeight = document.documentElement.clientHeight;
				} else {
					const viewport = document.getElementById('mainViewport');
					scrollTop = viewport.scrollTop;
					scrollHeight = viewport.scrollHeight;
					clientHeight = viewport.clientHeight;
				}

				// 2. 导航栏高亮逻辑 (保留原有逻辑)
				let cur = 0;
				db.forEach((_, i) => {
					const el = document.getElementById(`cat-${i}`);
					if(el && el.getBoundingClientRect().top < 200) cur = i;
				});
				document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
				const active = document.getElementById(`nav-${cur}`);
				if(active) active.classList.add('active');

				// 3. 移动端头部样式 (保留原有逻辑)
				if(isMobile) {
					if(scrollTop > 50) {
						mobileHeader.classList.add('scrolled');
					} else {
						mobileHeader.classList.remove('scrolled');
					}
				}

				// 4. 计算并更新圆环进度
				let scrollPercent = scrollTop / (scrollHeight - clientHeight);
				if (isNaN(scrollPercent)) scrollPercent = 0;
				if (scrollPercent > 1) scrollPercent = 1;
				if (scrollPercent < 0) scrollPercent = 0;
				
				setProgress(scrollPercent);

				// 重置标记，允许下一次更新
				ticking = false;
			};

			// 监听滚动事件
			scrollTarget.addEventListener('scroll', () => {
				if (!ticking) {
					// 如果当前没有在处理动画帧，则请求下一帧
					window.requestAnimationFrame(updateProgress);
					ticking = true;
				}
			});
		});

        function scrollToTop() { 
            if(window.innerWidth < 768) {
                window.scrollTo({top: 0, behavior: 'smooth'});
            } else {
                document.getElementById('mainViewport').scrollTo({top:0, behavior:'smooth'}); 
            }
        }

        function openAddModal() {
            editState = null; 
            document.getElementById('modalTitle').innerText = "添加新资源";
            document.getElementById('catGroup').style.display = 'block';
            document.getElementById('editModal').style.display = 'flex';
            document.querySelector('form').reset();
            isNewCat = false; toggleNewCatUI();
        }

        function openEditModal(cIdx, iIdx, e) {
            e.preventDefault(); e.stopPropagation();
            editState = { cIdx, iIdx };
            const item = db[cIdx].items[iIdx];
            document.getElementById('modalTitle').innerText = "编辑资源";
            document.getElementById('catGroup').style.display = 'none';
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemUrl').value = item.url;
            document.getElementById('itemDesc').value = item.desc || '';
            document.getElementById('itemIcon').value = item.icon || '';
            document.getElementById('editModal').style.display = 'flex';
        }

        function saveItem(e) {
            e.preventDefault();
            const name = document.getElementById('itemName').value;
            const url = document.getElementById('itemUrl').value;
            const desc = document.getElementById('itemDesc').value;
            const icon = document.getElementById('itemIcon').value;
            const newItem = { name, url, desc, icon };

            if (editState) {
                db[editState.cIdx].items[editState.iIdx] = newItem;
            } else {
                let catIdx;
                if (isNewCat) {
                    const newCatName = document.getElementById('newCatInput').value.trim();
                    if(!newCatName) return alert('请输入分类名');
                    db.push({ category: newCatName, items: [] });
                    catIdx = db.length - 1;
                } else {
                    catIdx = document.getElementById('catSelect').value;
                }
                db[catIdx].items.push(newItem);
            }
            saveDB(); renderPage(); closeModal('editModal');
        }

        function delItem(cIdx, iIdx, e) {
            e.preventDefault(); e.stopPropagation();
            if(confirm('确认删除此项吗？')) {
                db[cIdx].items.splice(iIdx, 1);
                saveDB(); renderPage();
            }
        }

        function toggleNewCat() { isNewCat = !isNewCat; toggleNewCatUI(); }
        function toggleNewCatUI() {
            const sel = document.getElementById('catSelect');
            const inp = document.getElementById('newCatInput');
            const txt = document.getElementById('catToggleText');
            if(isNewCat) { sel.style.display = 'none'; inp.style.display = 'block'; txt.innerText = '选已有?'; }
            else { sel.style.display = 'block'; inp.style.display = 'none'; txt.innerText = '新建?'; }
        }

        function closeModal(id) { 
			document.getElementById(id).style.display = 'none'; 
			// ★★★ 新增：恢复背景滚动 ★★★
			document.body.style.overflow = '';
			}
        
        function toggleTheme() {
            const body = document.body;
            if(body.hasAttribute('data-theme')) {
                body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                document.getElementById('themeIcon').className = 'ri-moon-line';
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                document.getElementById('themeIcon').className = 'ri-sun-line';
            }
        }
        
        function scrollToCat(idx) {
            document.getElementById(`cat-${idx}`).scrollIntoView({behavior:'smooth'});
            if(window.innerWidth<768) toggleSidebar();
        }

        function openLogModal() {
            const container = document.getElementById('logContent');
            
            // 生成时间轴 HTML
            const html = CHANGE_LOGS.map(log => `
                <div class="timeline-item">
                    <div class="timeline-date">${log.date}</div>
                    <div class="timeline-content">${log.content}</div>
                </div>
            `).join('');

            container.innerHTML = `<div class="timeline">${html}</div>`;
            
            // 显示模态框
            document.getElementById('logModal').style.display = 'flex';
			// ★★★ 新增：锁定背景滚动 ★★★
			document.body.style.overflow = 'hidden';
        }
        
        function toggleSidebar() { 
            const sb = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sb.classList.toggle('show');
            overlay.classList.toggle('show');
        }

        function openExportModal() {
            document.getElementById('exportArea').value = JSON.stringify(db, null, 4);
            document.getElementById('exportModal').style.display = 'flex';
        }
        function copyCode() {
            document.getElementById('exportArea').select();
            document.execCommand('copy');
            alert('已复制');
        }

        init();
    </script>
</body>
</html>

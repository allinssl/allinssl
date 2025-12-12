// 应用主文件 - 演示JS中的各种引用

// ES6 模块导入
import './utils.js?v=175568710602835';
import './components/header.js?v=175568710602856';
import '../styles/theme.css?v=175568710602889';

// CommonJS 风格的引用（在某些环境中）
// const config = require('./config.js?v=1755687106028');
// require('./polyfills.js?v=1755687106028');

// 动态导入
const loadModule = async () => {
    try {
        const module = await import('./modules/feature.js');
        return module.default;
    } catch (error) {
        console.error('模块加载失败:', error);
    }
};

// 应用初始化
class App {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚀 Random Cache Plugin 示例应用已启动');
        this.setupEventListeners();
        this.loadDynamicContent();
    }
    
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ DOM 内容已加载');
            this.highlightProcessedFiles();
        });
        
        // 添加按钮点击事件
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', this.handleButtonClick.bind(this));
        });
    }
    
    handleButtonClick(event) {
        const button = event.target;
        console.log('按钮被点击:', button.textContent);
        
        // 添加点击效果
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }
    
    async loadDynamicContent() {
        try {
            // 模拟动态加载内容
            const feature = await loadModule();
            if (feature) {
                console.log('✅ 动态模块加载成功');
            }
        } catch (error) {
            console.error('❌ 动态内容加载失败:', error);
        }
    }
    
    highlightProcessedFiles() {
        // 检查页面中的资源链接，高亮显示已处理的文件
        const links = document.querySelectorAll('link[href], script[src]');
        let processedCount = 0;
        
        links.forEach(link => {
            const url = link.href || link.src;
            if (url && url.includes('?v=')) {
                processedCount++;
                // 添加视觉标识
                link.setAttribute('data-processed', 'true');
            }
        });
        
        console.log(`📊 检测到 ${processedCount} 个已处理的资源文件`);
        
        // 在页面上显示统计信息
        this.displayStats(processedCount, links.length);
    }
    
    displayStats(processed, total) {
        const statsElement = document.createElement('div');
        statsElement.className = 'stats-banner';
        statsElement.innerHTML = `
            <div class="stats-content">
                <span class="stats-icon">📊</span>
                <span class="stats-text">
                    已处理 ${processed}/${total} 个资源文件
                </span>
                <button class="stats-close" onclick="this.parentElement.parentElement.remove()">
                    ×
                </button>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .stats-banner {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                color: white;
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            
            .stats-content {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                gap: 8px;
            }
            
            .stats-icon {
                font-size: 1.2em;
            }
            
            .stats-text {
                font-weight: 500;
            }
            
            .stats-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5em;
                cursor: pointer;
                padding: 0;
                margin-left: 8px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .stats-close:hover {
                background-color: rgba(255,255,255,0.2);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(statsElement);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (statsElement.parentElement) {
                statsElement.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    statsElement.remove();
                }, 300);
            }
        }, 5000);
    }
}

// 工具函数
const utils = {
    // 格式化时间戳
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN');
    },
    
    // 提取随机数参数
    extractRandomParam(url) {
        const match = url.match(/[?&]v=([^&]+)/);
        return match ? match[1] : null;
    },
    
    // 检查是否为处理过的URL
    isProcessedUrl(url) {
        return /[?&]v=\d+_[a-z0-9]{6}/.test(url);
    }
};

// 导出工具函数供其他模块使用
window.AppUtils = utils;

// 启动应用
const app = new App();

// 在控制台显示欢迎信息
console.log(`
%c🎉 Random Cache Plugin 示例应用
%c这个应用演示了插件如何为各种资源添加随机数参数来解决缓存问题。

%c功能特性：
• 自动为 CSS/JS 文件添加随机数参数
• 支持各种引用模式（HTML标签、CSS @import、JS import等）
• 保持原有文件格式和功能不变
• 提供详细的处理日志

%c打开开发者工具的网络面板，刷新页面查看带有随机数参数的请求！
`, 
'color: #4CAF50; font-size: 16px; font-weight: bold;',
'color: #666; font-size: 14px;',
'color: #2196F3; font-size: 14px;',
'color: #FF9800; font-size: 14px; font-weight: bold;'
);

export default app;
/**
 * @fileoverview WHOIS 查询页面逻辑
 * @description 提供域名 WHOIS 信息查询功能，复用现有 API 和样式
 */

import { queryWhois } from "@api/landing";

// 安全的jQuery访问函数
function safe$() {
  return (window as any).$ as any;
}

// 页面状态管理
let currentDomain = '';
let isInitialized = false;

/**
 * 初始化页面
 */
function init() {
  if (isInitialized) {
    return;
  }
  
  bindEvents();
  handleUrlParams();
  isInitialized = true;
}

/**
 * 绑定事件
 */
function bindEvents() {
  const $ = safe$();
  if (!$) return;

  // 搜索按钮点击事件
  $(document).on('click', '#whois-search-btn', handleSearch);

  // 输入框回车事件
  $(document).on('keypress', '#whois-domain-input', (e: any) => {
    if (e.which === 13) {
      handleSearch();
    }
  });

  // 清空输入按钮
  $(document).on('click', '#whois-clear-input', () => {
    $('#whois-domain-input').val('').trigger('input');
  });

  // 输入框变化事件
  $(document).on('input', '#whois-domain-input', (e: any) => {
    const value = $(e.target).val() as string;
    const $clearBtn = $('#whois-clear-input');
    
    if (value && value.trim()) {
      $clearBtn.addClass('visible');
    } else {
      $clearBtn.removeClass('visible');
    }
  });
}

/**
 * 处理 URL 参数
 */
function handleUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const domain = urlParams.get('domain');
  const $ = safe$();
  if (!$) return;
  
  if (domain) {
    $('#whois-domain-input').val(domain).trigger('input');
    performSearch(domain);
  }
}

/**
 * 验证域名格式
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain.trim());
}

/**
 * 处理搜索操作
 */
function handleSearch() {
  const $ = safe$();
  if (!$) return;
  
  const domain = ($('#whois-domain-input').val() as string).trim();
  
  if (!domain) {
    alert('请输入要查询的域名');
    return;
  }

  if (!isValidDomain(domain)) {
    alert('请输入正确的域名格式');
    return;
  }

  performSearch(domain);
}

/**
 * 执行 WHOIS 查询
 */
async function performSearch(domain: string) {
	currentDomain = domain;
  showLoading();

  try {
		const response = await queryWhois(domain);
		// const response = {
    //   code: 0,
    //   status: true,
    //   msg: "查询成功",
    //   data: {
    //     address: [
    //       "3th Floor, BangNing Technology Park, 2 YuHua Avenue",
    //       "Yuhuatai District",
    //       "Nanjing Jiangsu",
    //       "China",
    //       "3th Floor, BangNing Technology Park, 2 YuHua Avenue",
    //       "Yuhuatai District",
    //       "Nanjing Jiangsu",
    //       "China",
    //       "3th Floor, BangNing Technology Park, 2 YuHua Avenue",
    //       "Yuhuatai District",
    //       "Nanjing Jiangsu",
    //       "China",
    //     ],
    //     city: "",
    //     country: "CN",
    //     creation_date: "2014-07-24 10:45:35",
    //     dnssec: "signed",
    //     domain_name: "top",
    //     emails: ["support@nic.top", "tech@nic.top"],
    //     expiration_date: "",
    //     name: "Sven Chen",
    //     name_servers: [
    //       "A.ZDNSCLOUD.CN 203.99.24.1",
    //       "B.ZDNSCLOUD.CN 203.99.25.1",
    //       "C.ZDNSCLOUD.COM 203.99.26.1",
    //       "D.ZDNSCLOUD.COM 203.99.27.1",
    //       "F.ZDNSCLOUD.CN 116.169.54.111",
    //       "G.ZDNSCLOUD.COM 223.72.199.37",
    //       "I.ZDNSCLOUD.CN 2401:8d00:1:0:0:0:0:1",
    //       "J.ZDNSCLOUD.COM 2401:8d00:2:0:0:0:0:1",
    //     ],
    //     org: "Jiangsu Bangning Science & technology Co.,Ltd.",
    //     phone: [
    //       "+86 18936016161",
    //       "Fax: +86 2586883476",
    //       "+86 15895978960",
    //       "Fax: +86 02586883476",
    //     ],
    //     referral_url: "whois.nic.top",
    //     registrant_postal_code: "",
    //     registrar: "",
    //     registrar_url: "",
    //     reseller: null,
    //     state: "",
    //     status: "ACTIVE",
    //     updated_date: "2025-07-29 10:45:35",
    //     whois_server: "whois.nic.top",
    //     rawData:
    //       "% IANA WHOIS server\n% for more information on IANA, visit http://www.iana.org\n% This query returned 1 object\n\nrefer:        whois.nic.top\n\ndomain:       TOP\n\norganisation: .TOP Registry\naddress:      3th Floor, BangNing Technology Park, 2 YuHua Avenue\naddress:      Yuhuatai District\naddress:      Nanjing Jiangsu\naddress:      China\n\ncontact:      administrative\nname:         Sven Chen\norganisation: Jiangsu Bangning Science & technology Co.,Ltd.\naddress:      3th Floor, BangNing Technology Park, 2 YuHua Avenue\naddress:      Yuhuatai District\naddress:      Nanjing Jiangsu\naddress:      China\nphone:        +86 18936016161\nfax-no:       +86 2586883476\ne-mail:       support@nic.top\n\ncontact:      technical\nname:         YiFeng Shen\norganisation: Jiangsu Bangning Science & technology Co.,Ltd.\naddress:      3th Floor, BangNing Technology Park, 2 YuHua Avenue\naddress:      Yuhuatai District\naddress:      Nanjing Jiangsu\naddress:      China\nphone:        +86 15895978960\nfax-no:       +86 02586883476\ne-mail:       tech@nic.top\n\nnserver:      A.ZDNSCLOUD.CN 203.99.24.1\nnserver:      B.ZDNSCLOUD.CN 203.99.25.1\nnserver:      C.ZDNSCLOUD.COM 203.99.26.1\nnserver:      D.ZDNSCLOUD.COM 203.99.27.1\nnserver:      F.ZDNSCLOUD.CN 116.169.54.111\nnserver:      G.ZDNSCLOUD.COM 223.72.199.37\nnserver:      I.ZDNSCLOUD.CN 2401:8d00:1:0:0:0:0:1\nnserver:      J.ZDNSCLOUD.COM 2401:8d00:2:0:0:0:0:1\nds-rdata:     26780 8 2 5d6e7869ee8e3b536a617de89482ddd1dcb9db9dbb1ac33d6ed351e2ca095b1b\n\nwhois:        whois.nic.top\n\nstatus:       ACTIVE\nremarks:      Registration information: http://www.nic.top\n\ncreated:      2014-07-24\nchanged:      2025-07-29\nsource:       IANA",
    //   },
    // };
    if (response.status && response.data) {
      renderResults(domain, response.data);
      showResults();
      updatePageState(domain);
    } else {
      throw new Error('查询失败');
    }
  } catch (error: any) {
    console.error('WHOIS查询失败:', error);
    showError(error.message || '查询失败，请稍后重试');
  }
}

/**
 * 渲染查询结果
 */
function renderResults(domain: string, data: any) {
	console.log(domain,'-21212');
  const $ = safe$();
  if (!$) return;

  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const resultsHtml = generateSimpleLayout(domain, data, currentTime);
  $('#whois-content-area').html(resultsHtml);
}

/**
 * 生成简洁表格式布局
 */
function generateSimpleLayout(domain: string, data: any, currentTime: string): string {
  const domainName = domain;
  
  return `
    <div class="whois-simple-layout">
      <!-- 标题区域 -->
      <div class="whois-header">
        <h2 class="whois-title">
          <span class="title-decoration"></span>
          <span class="domain-name">${domainName}</span> 域名注册信息
        </h2>
        <div class="whois-meta">
          <span>以下信息获取时间：${currentTime}</span>
          <a href="#" class="refresh-link" onclick="performSearch('${domain}')">获取最新信息</a>
        </div>
      </div>
      
      <!-- 信息表格 -->
      <div class="whois-table">
        ${generateWhoisRows(data)}
      </div>
      
             <!-- 原始数据区域 -->
       <div class="whois-raw-data-section">
         <div class="raw-data-content">
           <div class="raw-data-title">
             <span class="title-decoration"></span>
             <span>${domainName} 完整WHOIS信息</span>
           </div>
           <div class="raw-data-box">${formatRawData(data.rawData || '暂无原始数据')}</div>
         </div>
       </div>
    </div>
  `;
}

/**
 * 生成WHOIS信息行
 */
function generateWhoisRows(data: any): string {
  // 处理邮箱数据
  const emails = Array.isArray(data.emails)
    ? data.emails.join(", ")
    : data.emails || "请联系当前域名注册商获取";

  // 处理域名服务器数据
  const nameServers = Array.isArray(data.name_servers)
    ? data.name_servers
    : data.name_servers ? [data.name_servers] : [];

  // 处理状态
  const status = data.status || "未知状态";
  let statusBadgeClass = "status-unknown";
  if (status.includes("ACTIVE") || status.includes("ok")) {
    statusBadgeClass = "status-active";
  } else if (status.includes("Transfer")) {
    statusBadgeClass = "status-transfer";
  }

  const rows = [
    {
      labelCn: "域名所有者",
      labelEn: "Registrant",
      value: data.name || "请联系当前域名注册商获取",
    },
    {
      labelCn: "所有者邮箱",
      labelEn: "Registrant Email",
      value: emails,
    },
    {
      labelCn: "注册商",
      labelEn: "Registrar",
      value:
        data.registrar ||
        data.org ||
        "Guizhou Zhongyu Zhike Network Technology Co., Ltd.",
    },
    {
      labelCn: "注册时间",
      labelEn: "Registration Date",
      value:
        formatDateTime(data.creation_date) || "2020-10-24 16:00:12 (北京时间)",
    },
    {
      labelCn: "到期时间",
      labelEn: "Expiration Date",
      value:
        formatDateTime(data.expiration_date) ||
        "2026-10-24 16:00:12 (北京时间)",
      extraInfo: data.expiration_date
        ? `
        <div style="margin-top: 8px; font-size: 12px; color: #666; line-height: 1.4;">
          · 该域名到期时间仅供参考，实际到期时间请咨询对应注册商，费时云资源域名以控制台到期时间和消息提醒为准。<br>
          · 请在实际到期时间前续费，否则将导致该域名使用异常。
        </div>
      `
        : "",
    },
    {
      labelCn: "域名状态",
      labelEn: "Domain Status",
      value: `
        <div class="whois-status-value">
          <span>${status}</span>
          <span class="whois-status-badge-simple ${statusBadgeClass}">(${status === 'ACTIVE'?'正常':status})</span>
        </div>
      `,
    },
  ];

  // 如果有DNS服务器，添加DNS信息行
  if (nameServers.length > 0) {
    rows.push({
      labelCn: 'DNS 服务器',
      labelEn: 'Name Server',
      value: `
        <div class="whois-value-multiple">
          ${nameServers.map((server: string) => `<div class="whois-dns-item">${server}</div>`).join('')}
        </div>
      `
    });
  }

  return rows.map(row => `
    <div class="whois-row">
      <div class="whois-label">
        <div class="label-cn">${row.labelCn}</div>
        <div class="label-en">${row.labelEn}</div>
      </div>
      <div class="whois-value">
        ${row.value}
        ${(row as any).extraInfo || ''}
      </div>
    </div>
  `).join('');
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).replace('GMT+8', '北京时间');
  } catch {
    return dateString;
  }
}

/**
 * 格式化原始数据
 */
function formatRawData(rawData: string): string {
  if (!rawData || rawData === '暂无原始数据') {
    return rawData;
  }
  
  // 确保原始数据保持原有格式，只是清理多余的空行
  return rawData.trim();
}

/**
 * 显示加载状态
 */
function showLoading() {
  const $ = safe$();
  if (!$) return;
  
  $('#whois-results-section').addClass('hidden');
  $('#whois-error-section').addClass('hidden');
  $('#whois-loading-section').removeClass('hidden');
}

/**
 * 显示结果
 */
function showResults() {
  const $ = safe$();
  if (!$) return;
  
  $('#whois-loading-section').addClass('hidden');
  $('#whois-error-section').addClass('hidden');
  $('#whois-results-section').removeClass('hidden');
}

/**
 * 显示错误信息
 */
function showError(message: string) {
  const $ = safe$();
  if (!$) return;
  
  $('#whois-error-message').text(message);
  $('#whois-loading-section').addClass('hidden');
  $('#whois-results-section').addClass('hidden');
  $('#whois-error-section').removeClass('hidden');
}

/**
 * 更新页面状态（标题和URL）
 */
function updatePageState(domain: string) {
  document.title = `${domain} - WHOIS 查询结果 - 堡塔域名注册`;
  
  const newUrl = `${window.location.pathname}?domain=${encodeURIComponent(domain)}`;
  window.history.replaceState({ domain }, '', newUrl);
}

/**
 * 暴露必要的函数到全局作用域
 */
(window as any).performSearch = performSearch;

// 页面初始化逻辑
function safeInit() {
  // 确保DOM和jQuery都已准备就绪
  if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM已经准备就绪
    if (safe$()) {
      // jQuery也已加载
  init();
} else {
      // 等待jQuery加载
  window.addEventListener('load', init);
} 
  }
}

// 开始初始化
safeInit(); 
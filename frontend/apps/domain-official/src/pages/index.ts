import "virtual:uno.css";
import "../styles/index.css";
import { renderTemplateList } from "@utils/core";
import type { DomainPrice } from "@types";
import { NotificationManager } from "@utils";
import { bindContactServicePopupClick } from "@utils";

window.isLoggedIn = localStorage.getItem("isLogin") === "true";

/**
 * 域名价格数据 - 纯数据对象f
 */
const domainPriceData: DomainPrice[] = [
  {
    suffix: ".com",
    originalPrice: 89,
    firstYearPrice: 54,
    renewPrice: 79,
    transferPrice: 79,
  },
  {
    suffix: ".net",
    originalPrice: 99,
    firstYearPrice: 86,
    renewPrice: 89,
    transferPrice: 89,
  },
  {
    suffix: ".cn",
    originalPrice: 39,
    firstYearPrice: 20,
    renewPrice: 34,
    transferPrice: 31,
  },
  {
    suffix: ".top",
    originalPrice: 49,
    firstYearPrice: 9.9,
    renewPrice: 31,
    transferPrice: 31,
    // isWan: true,
  },
  {
    suffix: ".cyou",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 98,
    transferPrice: 98,
    // isWan: true,
  },
  {
    suffix: ".icu",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 98,
    transferPrice: 98,
    // isWan: true,
  },
  {
    suffix: ".xyz",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 92,
    transferPrice: 92,
    // isWan: true,
  },
];

/**
 * 获取所有域名价格数据
 * @returns 所有可展示的域名价格数据列表
 */
const getAllDomains = (): DomainPrice[] => domainPriceData;

/**
 * jQuery 工厂（保持与现有页面环境兼容）
 * @param selector 选择器或元素
 * @returns jQuery 包装后的对象
 */
const $ = (selector: any): any => (window as any).jQuery(selector);

/**
 * 初始化 FAQ 折叠面板
 */
const initFaqToggles = (): void => {
  $(".faq-toggle").on("click", function (this: any) {
    const $content = $(this).next();
    const $icon = $(this).find("i");

    $content.toggleClass("hidden");
    $icon.toggleClass("rotate-180");

    $(".faq-toggle")
      .not(this)
      .each(function (this: any) {
        $(this).next().addClass("hidden");
        $(this).find("i").removeClass("rotate-180");
      });
  });
};

/**
 * 初始化页面加载动画（进入视口淡入）
 */
const initPageLoadAnimations = (): void => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $(entry.target)
            .addClass("opacity-100 translate-y-0")
            .removeClass("opacity-0 translate-y-10");
        }
      });
    },
    { threshold: 0.1 }
  );

  $("section").each(function (this: any) {
    $(this).addClass("transition-all duration-700 opacity-0 translate-y-10");
    observer.observe(this);
  });

  $("section:first-of-type")
    .addClass("opacity-100 translate-y-0")
    .removeClass("opacity-0 translate-y-10");
};

/**
 * 处理域名查询动作（按钮或回车触发）
 */
const handleDomainQuery = (): void => {
  const $input = $("#domain-query-input");
  const query = String(($input.val() as string) || "").trim();

  // 校验：不支持中文
  const hasChinese = /[\u4e00-\u9fa5]/.test(query);
  if (hasChinese) {
    // 提示并退出
    NotificationManager.show({
      type: "error",
      message: "不支持中文，请使用英文和数字",
    });
    $input.focus();
    return;
  }

  // 校验：仅允许字母、数字、连接符(-)和点(.)
  const hasInvalidChar = /[^a-zA-Z0-9\-.]/.test(query);
  if (hasInvalidChar) {
    NotificationManager.show({
      type: "error",
      message: "仅支持字母、数字、连接符(-)和点(.)",
    });
    $input.focus();
    return;
  }

  // 规则：不能以连接符开头
  if (/^-/.test(query)) {
    NotificationManager.show({
      type: "error",
      message: "不能以连接符(-)开头",
    });
    $input.focus();
    return;
  }

  // 规则：不能仅由连接符组成（忽略点）
  const stripped = query.replace(/\./g, "");
  if (/^-+$/.test(stripped)) {
    NotificationManager.show({
      type: "error",
      message: "不能仅由连接符(-)组成",
    });
    $input.focus();
    return;
  }

  if (query) {
    window.location.href = `/new/domain-query-register.html?search=${encodeURIComponent(
      query
    )}`; // 跳转到注册页并携带查询词
  } else {
    $input.focus().addClass("shake"); // 空值时聚焦并触发轻微抖动提示
    const timer = window.setTimeout(() => $input.removeClass("shake"), 500); // 500ms 后移除抖动效果
    // 避免 TS 关于未使用变量的提示
    void timer;
  }
};

/**
 * 更新清空输入按钮显示状态
 */
const updateClearButtonVisibility = (): void => {
  const $input = $("#domain-query-input");
  const $clearBtn = $("#clear-input-button");

  if ($input.val() && $input.data("userTyped") === "true") {
    $clearBtn.addClass("visible");
  } else {
    $clearBtn.removeClass("visible"); // 用户未输入或为空时隐藏清空按钮
  }
};

/**
 * 初始化域名查询相关事件绑定
 */
const initDomainQueryEvents = (): void => {
  const $input = $("#domain-query-input");
  const $clearBtn = $("#clear-input-button");

  $("#domain-query-button").on("click", handleDomainQuery);

  $input.on("keypress", (e: any) => {
    if (e.key === "Enter") handleDomainQuery();
  });

  $clearBtn.on("click", () => {
    $input.val("").focus();
    updateClearButtonVisibility();
  });

  $input.on("focus input", function (this: any) {
    $(this).data("userTyped", "true");
    updateClearButtonVisibility();
  });
};

/**
 * 初始化移动端注册流程步骤切换器
 */
const initStepSwitcher = (): void => {
  const $stepSwitcher = $("#step-switcher");
  if (!$stepSwitcher.length) return;

  const $stepWrapper = $stepSwitcher.find(".step-wrapper");
  const $steps = $stepSwitcher.find(".step-content");
  const $indicators = $stepSwitcher.find(".step-indicator");
  const $prevBtn = $stepSwitcher.find(".prev-btn");
  const $nextBtn = $stepSwitcher.find(".next-btn");

  let currentStep = 0;

  /**
   * 切换到指定步骤
   * @param stepIndex 步骤索引（0 开始）
   */
  const updateStep = (stepIndex: number): void => {
    const translateX = -stepIndex * 20; // 每步等宽 20%，通过水平位移切换
    $stepWrapper.css("transform", `translateX(${translateX}%)`);

    $indicators.each(function (this: any, index: number) {
      if (index === stepIndex) {
        $(this).addClass("bg-primary").removeClass("bg-gray-300");
      } else {
        $(this).addClass("bg-gray-300").removeClass("bg-primary");
      }
    });

    $("#step-counter").text(`${stepIndex + 1} / ${$steps.length}`); // 更新步骤计数器

    $prevBtn
      .prop("disabled", stepIndex === 0)
      .toggleClass("opacity-50 cursor-not-allowed", stepIndex === 0); // 首步禁用“上一步”

    $nextBtn
      .prop("disabled", stepIndex === $steps.length - 1)
      .toggleClass(
        "opacity-50 cursor-not-allowed",
        stepIndex === $steps.length - 1
      ); // 末步禁用“下一步”
  };

  $prevBtn.on("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateStep(currentStep);
    }
  });

  $nextBtn.on("click", () => {
    if (currentStep < $steps.length - 1) {
      currentStep++;
      updateStep(currentStep);
    }
  });

  $indicators.on("click", function (this: any) {
    const stepIndex = parseInt($(this).data("step"), 10);
    currentStep = stepIndex;
    updateStep(currentStep);
  });

  updateStep(0);
};

/**
 * 初始化搜索框模拟打字效果（鼠标悬停触发，用户输入后停止）
 */
const initTypewriterEffect = (): void => {
  const $input = $("#domain-query-input");
  const $clearBtn = $("#clear-input-button");
  if (!$input.length || !$clearBtn.length) return;

  const exampleDomains = [
    "mycompany.com",
    "mybrand.cn",
    "mystore.shop",
    "myapp.tech",
    "myservice.net",
  ]; // 轮播展示的示例域名
  let currentExampleIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;
  let isAnimating = false;
  let typewriterTimer: number | undefined;
  let mouseHoverTimer: number | undefined;
  let lastMousePosition = { x: 0, y: 0 };

  /**
   * 执行一次打字机动画步骤
   */
  const typeWriter = (): void => {
    if ($input.data("userTyped") === "true") {
      if (typewriterTimer) window.clearTimeout(typewriterTimer);
      updateClearButtonVisibility();
      return;
    }

    isAnimating = true; // 标记动画进行中
    $clearBtn.removeClass("visible"); // 避免自动演示时显示清空按钮

    const currentDomain = exampleDomains[currentExampleIndex] as string;

    if (isDeleting) {
      $input.val(currentDomain.substring(0, currentCharIndex - 1));
      currentCharIndex--;

      if (currentCharIndex === 0) {
        isDeleting = false;
        currentExampleIndex = (currentExampleIndex + 1) % exampleDomains.length;
        typewriterTimer = window.setTimeout(typeWriter, 1000); // 完整展示后切到下一个示例前停顿
        return;
      }
    } else {
      $input.val(currentDomain.substring(0, currentCharIndex + 1));
      currentCharIndex++;

      if (currentCharIndex === currentDomain.length) {
        typewriterTimer = window.setTimeout(() => {
          isDeleting = true; // 末尾停顿后开始删除
          typeWriter();
        }, 2000);
        return;
      }
    }

    const delay = isDeleting ? 50 : Math.random() * 100 + 100; // 打字更慢、删除更快
    typewriterTimer = window.setTimeout(typeWriter, delay);
  };

  /**
   * 重置输入框与动画状态
   */
  const resetInputState = (): void => {
    if (typewriterTimer) window.clearTimeout(typewriterTimer);
    if (mouseHoverTimer) window.clearTimeout(mouseHoverTimer);

    if (isAnimating && $input.data("userTyped") !== "true") {
      $input.val(""); // 清空并重置
      currentCharIndex = 0;
      isDeleting = false;
      isAnimating = false;
    }
    updateClearButtonVisibility();
  };

  /**
   * 开始检测鼠标悬停并延时触发打字机
   * @param event 鼠标事件
   */
  const startHoverDetection = (event: any): void => {
    lastMousePosition = { x: event.clientX, y: event.clientY };
    if (mouseHoverTimer) window.clearTimeout(mouseHoverTimer);
    if ($input.data("userTyped") === "true") return;
    mouseHoverTimer = window.setTimeout(typeWriter, 3000);
  };

  /**
   * 检查鼠标移动，保持/重启动画
   * @param event 鼠标事件
   */
  const checkMouseMovement = (event: any): void => {
    if (
      event.clientX !== lastMousePosition.x ||
      event.clientY !== lastMousePosition.y
    ) {
      lastMousePosition = { x: event.clientX, y: event.clientY };
      if (isAnimating) resetInputState();
      startHoverDetection(event);
    }
  };

  $(document).on("mousemove", checkMouseMovement);
  $(document).on("mouseenter", startHoverDetection);
  startHoverDetection({ clientX: 0, clientY: 0 }); // 初次进入即开始检测
};

/**
 * 初始化价格表格（基于 HTML 模板渲染）
 */
const initPriceTable = (): void => {
  const $tableBody = $("#price-table-body");
  if (!$tableBody.length) return;
  const tableHTML = renderTemplateList("tpl-price-row", getAllDomains()); // 使用模板渲染价格行
  $tableBody.html(tableHTML);
};

/**
 * 滚动到页面顶部并聚焦搜索框
 */
const scrollToSearchBox = (): void => {
  $("html, body").animate({ scrollTop: 0 }, 500); // 平滑滚动到顶部
  window.setTimeout(() => $("#domain-query-input").focus(), 500); // 滚动后聚焦输入框
};

/**
 * 初始化底部“回到搜索”按钮
 */
const initScrollToSearchButton = (): void => {
  $("#scroll-to-search-btn").on("click", scrollToSearchBox);
};

/**
 * 初始化"联系客服"二维码悬浮显隐效果
 */
const initServiceQRCode = (): void => {
  bindContactServicePopupClick();
};

/**
 * 初始化购物车按钮显示逻辑
 */
const initCartButton = (): void => {
  const $cartButton = $("#cart-button");

  // 检测用户登录状态
  if ((window as any).isLoggedIn) {
    $cartButton.show();
  } else {
    $cartButton.hide();
  }
};

/**
 * 初始化所有 UI 事件与页面效果
 */
const initUIEvents = (): void => {
  initFaqToggles();
  initPageLoadAnimations();
  initDomainQueryEvents();
  initStepSwitcher();
  initTypewriterEffect();
  initPriceTable();
  initScrollToSearchButton();
  initServiceQRCode();
  initCartButton();
};

/**
 * 应用初始化（等待 jQuery 可用后初始化 UI）
 */
const initApp = (): void => {
  if (typeof (window as any).jQuery === "undefined") {
    window.setTimeout(initApp, 100); // 依赖 jQuery，未加载则轮询等待
    return;
  }
  initUIEvents();
  (window as any).scrollToSearchBox = scrollToSearchBox; // 暴露给内联事件或其他脚本调用
};

/**
 * DOM 加载完成后初始化应用
 */
$(document).ready(initApp); // DOM 就绪后启动

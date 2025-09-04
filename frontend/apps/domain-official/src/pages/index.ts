import "virtual:uno.css";
import "../styles/index.css";
import { renderTemplateList } from "@utils/core";
import type { DomainPrice } from "@types";
import { NotificationManager } from "@utils";
import { bindContactServicePopupClick } from "@utils";
import { getSeckillActivityInfo, grabSeckill } from "../api/landing";

// window.isLoggedIn = localStorage.getItem("isLogin") === "true";
window.isLoggedIn = true;
const isDev = (): boolean => process.env.NODE_ENV === "development";

/**
 * 秒杀活动状态枚举
 */
enum SeckillStatus {
  NOT_STARTED = 'not_started',    // 未开始
  CAN_QUALIFY = 'can_qualify',    // 可领资格
  CAN_SECKILL = 'can_seckill',    // 可秒杀  
  PARTICIPATED = 'participated',   // 已参与
  SOLD_OUT = 'sold_out'           // 已抢完
}
/**
 * 秒杀活动数据接口
 */
interface SeckillActivityData {
  startTime: string;  // 开始时间 (HH:mm 格式)
  totalQuota: number; // 总配额
  grabbedCount: number; // 已抢数量
  userStatus: SeckillStatus; // 用户状态
  isActive: boolean; // 活动是否激活
}

/**
 * 秒杀活动数据适配器
 */
class SeckillDataAdapter {
  /**
   * 映射API状态到前端状态
   */
  static mapGrabStatusToSeckillStatus(grabStatus: number, isLoggedIn: boolean): SeckillStatus {
    switch(grabStatus) {
      case 0: // 可抢
        return isLoggedIn ? SeckillStatus.CAN_SECKILL : SeckillStatus.CAN_QUALIFY;
      case 1: // 已抢到未使用  
      case 2: // 已使用
        return SeckillStatus.PARTICIPATED;
      case 3: // 活动未开始
        return SeckillStatus.NOT_STARTED;
      case 4: // 活动已结束
      case 5: // 已抢完
        return SeckillStatus.SOLD_OUT;
      default:
        return SeckillStatus.NOT_STARTED;
    }
  }
}

/**
 * 倒计时管理器
 */
class SeckillTimer {
  private targetTime: Date;
  private timer: number | null = null;
  private onUpdate: ((timeLeft: { hours: number; minutes: number; seconds: number }) => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(targetHour: number = 10, targetMinute: number = 0) {
    this.targetTime = this.calculateNextTarget(targetHour, targetMinute);
  }

  /**
   * 计算下一个目标时间
   */
  private calculateNextTarget(hour: number, minute: number): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    
    // 如果今天的时间已过，计算明天的时间
    if (today <= now) {
      today.setDate(today.getDate() + 1);
    }
    
    return today;
  }

  /**
   * 开始倒计时
   */
  start(onUpdate?: (timeLeft: { hours: number; minutes: number; seconds: number }) => void, onComplete?: () => void): void {
    this.onUpdate = onUpdate || null;
    this.onComplete = onComplete || null;
    this.tick();
  }

  /**
   * 停止倒计时
   */
  stop(): void {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 倒计时逻辑
   */
  private tick(): void {
    const now = new Date();
    const timeLeft = this.targetTime.getTime() - now.getTime();

    if (timeLeft <= 0) {
      // 倒计时结束
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (this.onUpdate) {
      this.onUpdate({ hours, minutes, seconds });
    }

    this.timer = window.setTimeout(() => this.tick(), 1000);
  }
}

/**
 * 秒杀活动状态管理器
 */
class SeckillStateManager {
  private currentStatus: SeckillStatus = SeckillStatus.NOT_STARTED;
  private activityData!: SeckillActivityData;
  private clickDebounceTimer: number | null = null;

  constructor() {
      // 初始化默认状态，等待API数据
      this.setupDefaultData();
  }

  /**
   * 异步初始化API数据
   */
  async initialize(): Promise<void> {
		await this.initWithApiData();
  }

  /**
   * 通过API初始化活动数据
   */
  async initWithApiData(): Promise<void> {
    try {
      const response = await getSeckillActivityInfo();
      if (response.status === true && response.data) {
        const { grab_status, remaining_coupons, total_coupons } = response.data;
        
        // 设置初始状态
				const isLoggedIn = (window as any).isLoggedIn;
        this.currentStatus = SeckillDataAdapter.mapGrabStatusToSeckillStatus(
          grab_status,
          isLoggedIn,
        );
        
        // 设置活动数据（保持现有结构）
        this.activityData = {
          startTime: "10:00", // 保持现有逻辑
          totalQuota: total_coupons,
          grabbedCount: total_coupons - remaining_coupons,
          userStatus: this.currentStatus,
          isActive: true // 保持现有逻辑
        };
      } else {
        // API调用失败，使用默认数据
        this.setupDefaultData();
      }
    } catch (error) {
      console.error('获取活动数据失败:', error);
      // 错误时使用默认数据
      this.setupDefaultData();
    }
	}

  /**
   * 设置默认数据
   */
  private setupDefaultData(): void {
    // 使用默认数据，保持现有逻辑
    const randomGrabbedCount = Math.floor(Math.random() * 30) + 5;
    this.activityData = {
      startTime: "10:00",
      totalQuota: 100,
      grabbedCount: randomGrabbedCount,
      userStatus: SeckillStatus.NOT_STARTED,
      isActive: true
    };
    this.currentStatus = SeckillStatus.NOT_STARTED;
  }

  /**
   * 更新状态
   */
  updateStatus(newStatus: SeckillStatus): void {
    this.currentStatus = newStatus;
  }

  /**
   * 获取当前状态
   */
  getCurrentStatus(): SeckillStatus {
    return this.currentStatus;
  }

  /**
   * 获取活动数据
   */
  getActivityData(): SeckillActivityData {
    return { ...this.activityData };
  }

  /**
   * 更新进度
   */
  updateProgress(grabbedCount: number): void {
    this.activityData.grabbedCount = Math.min(grabbedCount, this.activityData.totalQuota);
  }

  /**
   * 防重复点击
   */
  debounceClick(callback: () => void, delay: number = 3000): void {
    if (this.clickDebounceTimer) {
      return;
    }

    callback();
    this.clickDebounceTimer = window.setTimeout(() => {
      this.clickDebounceTimer = null;
    }, delay);
  }
}

/**
 * 秒杀活动主类
 */
class SeckillActivity {
  private timer: SeckillTimer;
  private stateManager: SeckillStateManager;
  private $container: any;
  private $btn: any;
  private $btnText: any;
  private $btnLoading: any;
  private $tips: any;
  private $progressBar: any;
  private $progressText: any;
  private $countdownSection: any;
  private $progressSection: any;
  
  constructor() {
		// 倒计时时间，10:00
		this.timer = new SeckillTimer(10, 0);
    
    this.stateManager = new SeckillStateManager();
    this.$container = $("#seckill-activity");
    this.$btn = $("#seckill-action-btn-flat");
    this.$btnText = this.$btn.find(".btn-text");
    this.$btnLoading = this.$btn.find(".btn-loading");
    this.$tips = $("#action-tips-flat");
    this.$progressBar = $("#progress-fill-flat");
    this.$progressText = $("#progress-text-flat");
    this.$countdownSection = $("#countdown-section");
    this.$progressSection = $("#progress-info-section");
  }

  /**
   * 初始化活动
   */
  async init(): Promise<void> {
    // 等待状态管理器数据加载完成
    await this.stateManager.initialize();
    
    this.renderInitialState();
    this.bindEvents();
    this.startTimer();
    this.checkActivityVisibility();
  }

  /**
   * 刷新活动状态和数据（用于API数据更新后重新渲染）
   */
  refreshState(): void {
    this.renderInitialState();
  }

  /**
   * 检查活动显示状态
   */
  private checkActivityVisibility(): void {
    // 模拟检查活动是否应该显示的逻辑
    const shouldShow = true; // 可以根据实际需求调整逻辑
    
    if (shouldShow) {
      this.$container.show().addClass('animate-fade-in');
    }
  }

  /**
   * 渲染初始状态
   */
  private renderInitialState(): void {
    const status = this.stateManager.getCurrentStatus();
    const data = this.stateManager.getActivityData();
    
    this.updateButtonState(status);
    
    // 根据状态决定显示倒计时还是进度条
    if (status === SeckillStatus.NOT_STARTED) {
      // 活动未开始，显示倒计时，隐藏进度条
      this.$countdownSection.show();
      this.$progressSection.hide();
    } else {
      // 活动已开始，隐藏倒计时，显示进度条
      this.$countdownSection.hide();
      this.$progressSection.show();
      this.updateProgress(data.grabbedCount, data.totalQuota);
    }
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    this.$btn.on('click', () => {
      this.stateManager.debounceClick(() => {
        this.handleButtonClick();
      });
    });
  }

  /**
   * 开始倒计时
   */
  private startTimer(): void {
    this.timer.start(
      (timeLeft) => this.updateCountdown(timeLeft),
      () => this.onTimerComplete()
    );
  }

  /**
   * 更新倒计时显示 - 适配扁平化布局
   */
  private updateCountdown(timeLeft: { hours: number; minutes: number; seconds: number }): void {
    const $hours = $("#countdown-hours-flat");
    const $minutes = $("#countdown-minutes-flat");
    const $seconds = $("#countdown-seconds-flat");

    // 更新数字（无动画效果）
    const updateDigit = ($element: any, value: number) => {
      const newValue = value.toString().padStart(2, '0');
      $element.text(newValue);
    };

    updateDigit($hours, timeLeft.hours);
    updateDigit($minutes, timeLeft.minutes);
    updateDigit($seconds, timeLeft.seconds);

    // 时间紧迫时的特殊样式
    const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
    if (totalMinutes < 10) {
      $(".time-digit-mini").addClass('urgent');
    } else {
      $(".time-digit-mini").removeClass('urgent');
    }
  }

  /**
   * 倒计时完成处理
   */
  private onTimerComplete(): void {
    const isLoggedIn = (window as any).isLoggedIn;
    const newStatus = isLoggedIn ? SeckillStatus.CAN_SECKILL : SeckillStatus.CAN_QUALIFY;
    
    this.stateManager.updateStatus(newStatus);
    this.updateButtonState(newStatus);
    
    // 隐藏倒计时，显示进度条
    this.$countdownSection.hide();
    this.$progressSection.show();
    
    // 更新进度条显示
    const data = this.stateManager.getActivityData();
    this.updateProgress(data.grabbedCount, data.totalQuota);
    
    // 按钮闪烁提示
    this.$btn.addClass('blink');
    setTimeout(() => this.$btn.removeClass('blink'), 1500);

  }

  /**
   * 更新按钮状态
   */
  private updateButtonState(status: SeckillStatus): void {
    // 清除所有状态类
    this.$btn.removeClass('not-started can-qualify can-seckill participated sold-out loading');
    
    const config = this.getButtonConfig(status);
    this.$btn.addClass(config.className);
    this.$btnText.text(config.text);
    this.$tips.html(config.tips);
  }

  /**
   * 获取按钮配置
   */
  private getButtonConfig(status: SeckillStatus): { className: string; text: string; tips: string } {
    const configs = {
      [SeckillStatus.NOT_STARTED]: {
        className: "not-started",
        text: "即将开始",
        tips: "活动即将开始，请耐心等待",
      },
      [SeckillStatus.CAN_QUALIFY]: {
        className: "can-qualify",
        text: "领取资格",
        tips: "点击领取秒杀资格",
      },
      [SeckillStatus.CAN_SECKILL]: {
        className: "can-seckill",
        text: "立即领取",
        tips: "限时秒杀进行中，立即抢购",
      },
      [SeckillStatus.PARTICIPATED]: {
        className: "participated",
        text: "已领取",
        tips: "您已成功领取秒杀名额</br>快去<a href='/new/domain-query-register.html' class='text-primary hover:text-primary' target='_blank' rel='noopener'>注册域名</a>吧",
      },
      [SeckillStatus.SOLD_OUT]: {
        className: "sold-out",
        text: "已抢完",
        tips: "今日名额已抢完，明日再来",
      },
    };

    return configs[status];
  }

  /**
   * 处理按钮点击
   */
  private handleButtonClick(): void {
    const status = this.stateManager.getCurrentStatus();
    
    this.$btn.addClass('btn-click');
    setTimeout(() => this.$btn.removeClass('btn-click'), 200);

    switch (status) {
      case SeckillStatus.CAN_QUALIFY:
        this.handleQualifyAction();
        break;
      case SeckillStatus.CAN_SECKILL:
        this.handleSeckillAction();
        break;
      default:
        break;
    }
  }

  /**
   * 处理资格领取
   */
  private handleQualifyAction(): void {
      NotificationManager.show({
        type: "warning",
        message: "请先登录后再领取资格",
			});
			setTimeout(() => {
        location.href = `/login.html?ReturnUrl=${location.href}`;
      }, 2000);
  }

  /**
   * 处理秒杀操作
   */
	private async handleSeckillAction(): Promise<void> {
		try {
			this.setButtonLoading(true);
			// 这里请求领取接口
			const response = await grabSeckill() as any;
			
			if (response.status === true) {
				// 成功后更新状态
				this.stateManager.updateStatus(SeckillStatus.PARTICIPATED);
				
				// 更新进度（模拟增加一个已抢数量）
				const data = this.stateManager.getActivityData();
				const newGrabbedCount = data.grabbedCount + 1;
				this.stateManager.updateProgress(newGrabbedCount);
				this.updateProgress(newGrabbedCount, data.totalQuota);
				
				// 显示成功消息
				NotificationManager.show({
					type: "success",
					message: response.msg || "恭喜您！成功领取秒杀名额",
				});
			} else {
				// 失败时显示错误消息
				NotificationManager.show({
					type: "error",
					message: response.msg || "领取失败，请稍后重试",
				});
			}
		} catch (error: any) { 
			NotificationManager.show({
        type: "error",
        message: error.message || "网络错误，请稍后重试",
      });
		} finally {
			this.setButtonLoading(false);
		}
  }

  /**
   * 设置按钮加载状态
   */
  private setButtonLoading(loading: boolean): void {
    if (loading) {
      this.$btn.addClass('loading');
      this.$btnLoading.show();
    } else {
      this.$btn.removeClass('loading');
      this.$btnLoading.hide();
      const status = this.stateManager.getCurrentStatus();
      this.updateButtonState(status);
    }
  }

  /**
   * 更新进度条 - 支持百分比显示
   */
  private updateProgress(current: number, total: number): void {
    const percentage = Math.min((current / total) * 100, 100);
    this.$progressBar.css('width', `${percentage}%`);
    
    // 显示百分比
    if (percentage >= 100) {
      this.$progressText.text('已抢100%');
    } else {
      this.$progressText.text(`已抢${Math.floor(percentage)}%`);
    }
  }
}

/**
 * 域名价格数据 - 纯数据对象f
 */
const domainPriceData: DomainPrice[] = [
  {
    suffix: ".cn",
    originalPrice: 39,
    firstYearPrice: 19.9,
    renewPrice: 33.9,
    transferPrice: 29.9,
  },
  {
    suffix: ".com",
    originalPrice: 89,
    firstYearPrice: 53.9,
    renewPrice: 79,
    transferPrice: 79,
  },
  {
    suffix: ".top",
    originalPrice: 49,
    firstYearPrice: 9.9,
    renewPrice: 29.9,
    transferPrice: 29.9,
    // isWan: true,
  },
  {
    suffix: ".xyz",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 91.9,
    transferPrice: 91.9,
    // isWan: true,
  },
  {
    suffix: ".cyou",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 97.9,
    transferPrice: 97.9,
    // isWan: true,
  },
  {
    suffix: ".icu",
    originalPrice: 109,
    firstYearPrice: 9.9,
    renewPrice: 97.9,
    transferPrice: 97.9,
    // isWan: true,
  },
  {
    suffix: ".net",
    originalPrice: 99,
    firstYearPrice: 85.9,
    renewPrice: 85.9,
    transferPrice: 85.9,
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
    window.location.href = `${isDev() ? "" : "/new"}/domain-query-register.html?search=${encodeURIComponent(
      query,
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
 * 初始化秒杀活动
 */
const initSeckillActivity = async (): Promise<void> => {
  const seckillActivity = new SeckillActivity();
  await seckillActivity.init();
};

/**
 * 初始化所有 UI 事件与页面效果
 */
const initUIEvents = async (): Promise<void> => {
  initFaqToggles();
  initPageLoadAnimations();
  initDomainQueryEvents();
  initStepSwitcher();
  initTypewriterEffect();
  initPriceTable();
  initScrollToSearchButton();
  initServiceQRCode();
  initCartButton();
  // 异步初始化秒杀活动，等待API数据加载
  await initSeckillActivity();
};

/**
 * 应用初始化（等待 jQuery 可用后初始化 UI）
 */
const initApp = async (): Promise<void> => {
  if (typeof (window as any).jQuery === "undefined") {
    window.setTimeout(initApp, 100); // 依赖 jQuery，未加载则轮询等待
    return;
  }
  await initUIEvents();
  (window as any).scrollToSearchBox = scrollToSearchBox; // 暴露给内联事件或其他脚本调用
};

/**
 * DOM 加载完成后初始化应用
 */
$(document).ready(initApp); // DOM 就绪后启动

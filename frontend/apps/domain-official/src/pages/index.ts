import "virtual:uno.css";
import "../styles/index.css";
import { renderTemplateList } from "@utils/core";
import type { DomainPrice } from "@types";
import { NotificationManager } from "@utils";
import { bindContactServicePopupClick } from "@utils";
import { getSeckillActivityInfo, grabSeckill } from "../api/landing";

window.isLoggedIn = localStorage.getItem("isLogin") === "true";
// window.isLoggedIn = true;
const isDev = (): boolean => process.env.NODE_ENV === "development";

/**
 * 秒杀活动状态枚举
 */
// enum SeckillStatus {
//   NOT_STARTED = "not_started", // 未开始
//   CAN_QUALIFY = "can_qualify", // 可领资格
//   CAN_SECKILL = "can_seckill", // 可秒杀
//   PARTICIPATED = "participated", // 已参与
//   SOLD_OUT = "sold_out", // 已抢完
// }
/**
 * 秒杀活动数据接口
 */
// interface SeckillActivityData {
//   startTime: string; // 开始时间 (HH:mm 格式)
//   totalQuota: number; // 总配额
//   grabbedCount: number; // 已抢数量
//   userStatus: SeckillStatus; // 用户状态
//   isActive: boolean; // 活动是否激活
// }

/**
 * 秒杀活动数据适配器
 */
// class SeckillDataAdapter {
//   /**
//    * 映射API状态到前端状态
//    */
//   static mapGrabStatusToSeckillStatus(
//     grabStatus: number,
//     isLoggedIn: boolean
//   ): SeckillStatus {
//     switch (grabStatus) {
//       case 0: // 可抢
//         return isLoggedIn
//           ? SeckillStatus.CAN_SECKILL
//           : SeckillStatus.CAN_QUALIFY;
//       case 1: // 已抢到未使用
//       case 2: // 已使用
//         return SeckillStatus.PARTICIPATED;
//       case 3: // 活动未开始
//         return SeckillStatus.NOT_STARTED;
//       case 4: // 活动已结束
//       case 5: // 已抢完
//         return SeckillStatus.SOLD_OUT;
//       default:
//         return SeckillStatus.NOT_STARTED;
//     }
//   }
// }

/**
 * 折扣数据接口
 */
interface Discount {
  discounted_price: string | number;
  price?: number;
  name?: string;
}
/**
 * 组队价格数据接口
 */
interface TeamPrice {
  product_name: string;
  original_price: string | number;
  discounts: Discount[];
}

/**
 * 倒计时管理器
 */
// class SeckillTimer {
//   private targetTime: Date;
//   private timer: number | null = null;
//   private onUpdate:
//     | ((timeLeft: { hours: number; minutes: number; seconds: number }) => void)
//     | null = null;
//   private onComplete: (() => void) | null = null;

//   constructor(targetHour: number = 10, targetMinute: number = 0) {
//     this.targetTime = this.calculateNextTarget(targetHour, targetMinute);
//   }

//   /**
//    * 计算下一个目标时间
//    */
//   private calculateNextTarget(hour: number, minute: number): Date {
//     const now = new Date();
//     const today = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//       hour,
//       minute,
//       0
//     );

//     // 如果今天的时间已过，计算明天的时间
//     if (today <= now) {
//       today.setDate(today.getDate() + 1);
//     }

//     return today;
//   }

//   /**
//    * 开始倒计时
//    */
//   start(
//     onUpdate?: (timeLeft: {
//       hours: number;
//       minutes: number;
//       seconds: number;
//     }) => void,
//     onComplete?: () => void
//   ): void {
//     this.onUpdate = onUpdate || null;
//     this.onComplete = onComplete || null;
//     this.tick();
//   }

//   /**
//    * 停止倒计时
//    */
//   stop(): void {
//     if (this.timer) {
//       window.clearTimeout(this.timer);
//       this.timer = null;
//     }
//   }

//   /**
//    * 倒计时逻辑
//    */
//   private tick(): void {
//     const now = new Date();
//     const timeLeft = this.targetTime.getTime() - now.getTime();

//     if (timeLeft <= 0) {
//       // 倒计时结束
//       if (this.onComplete) {
//         this.onComplete();
//       }
//       return;
//     }

//     const hours = Math.floor(timeLeft / (1000 * 60 * 60));
//     const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
//     const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

//     if (this.onUpdate) {
//       this.onUpdate({ hours, minutes, seconds });
//     }

//     this.timer = window.setTimeout(() => this.tick(), 1000);
//   }
// }

/**
 * 秒杀活动状态管理器
 */
// class SeckillStateManager {
//   private currentStatus: SeckillStatus = SeckillStatus.NOT_STARTED;
//   private activityData!: SeckillActivityData;
//   private clickDebounceTimer: number | null = null;

//   constructor() {
//     // 初始化默认状态，等待API数据
//     this.setupDefaultData();
//   }

//   /**
//    * 异步初始化API数据
//    */
//   async initialize(): Promise<void> {
//     await this.initWithApiData();
//   }

//   /**
//    * 通过API初始化活动数据
//    */
//   async initWithApiData(): Promise<void> {
//     try {
//       const response = await getSeckillActivityInfo();
//       if (response.status === true && response.data) {
//         const { grab_status, remaining_coupons, total_coupons } = response.data;

//         // 设置初始状态
//         const isLoggedIn = (window as any).isLoggedIn;
//         this.currentStatus = SeckillDataAdapter.mapGrabStatusToSeckillStatus(
//           grab_status,
//           isLoggedIn
//         );

//         // 设置活动数据（保持现有结构）
//         this.activityData = {
//           startTime: "10:00", // 保持现有逻辑
//           totalQuota: total_coupons,
//           grabbedCount: total_coupons - remaining_coupons,
//           userStatus: this.currentStatus,
//           isActive: true, // 保持现有逻辑
//         };
//       } else {
//         // API调用失败，使用默认数据
//         this.setupDefaultData();
//       }
//     } catch (error) {
//       console.error("获取活动数据失败:", error);
//       // 错误时使用默认数据
//       this.setupDefaultData();
//     }
//   }

//   /**
//    * 设置默认数据
//    */
//   private setupDefaultData(): void {
//     // 使用默认数据，保持现有逻辑
//     const randomGrabbedCount = Math.floor(Math.random() * 30) + 5;
//     this.activityData = {
//       startTime: "10:00",
//       totalQuota: 100,
//       grabbedCount: randomGrabbedCount,
//       userStatus: SeckillStatus.NOT_STARTED,
//       isActive: true,
//     };
//     this.currentStatus = SeckillStatus.NOT_STARTED;
//   }

//   /**
//    * 更新状态
//    */
//   updateStatus(newStatus: SeckillStatus): void {
//     this.currentStatus = newStatus;
//   }

//   /**
//    * 获取当前状态
//    */
//   getCurrentStatus(): SeckillStatus {
//     return this.currentStatus;
//   }

//   /**
//    * 获取活动数据
//    */
//   getActivityData(): SeckillActivityData {
//     return { ...this.activityData };
//   }

//   /**
//    * 更新进度
//    */
//   updateProgress(grabbedCount: number): void {
//     this.activityData.grabbedCount = Math.min(
//       grabbedCount,
//       this.activityData.totalQuota
//     );
//   }

//   /**
//    * 防重复点击
//    */
//   debounceClick(callback: () => void, delay: number = 3000): void {
//     if (this.clickDebounceTimer) {
//       return;
//     }

//     callback();
//     this.clickDebounceTimer = window.setTimeout(() => {
//       this.clickDebounceTimer = null;
//     }, delay);
//   }
// }

/**
 * 秒杀活动主类
 */
// class SeckillActivity {
//   private timer: SeckillTimer;
//   private stateManager: SeckillStateManager;
//   private $container: any;
//   private $btn: any;
//   private $btnText: any;
//   private $btnLoading: any;
//   private $tips: any;
//   private $progressBar: any;
//   private $progressText: any;
//   private $countdownSection: any;
//   private $progressSection: any;

//   constructor() {
//     // 倒计时时间，10:00
//     this.timer = new SeckillTimer(10, 0);

//     this.stateManager = new SeckillStateManager();
//     this.$container = $("#seckill-activity");
//     this.$btn = $("#seckill-action-btn-flat");
//     this.$btnText = this.$btn.find(".btn-text");
//     this.$btnLoading = this.$btn.find(".btn-loading");
//     this.$tips = $("#action-tips-flat");
//     this.$progressBar = $("#progress-fill-flat");
//     this.$progressText = $("#progress-text-flat");
//     this.$countdownSection = $("#countdown-section");
//     this.$progressSection = $("#progress-info-section");
//   }

//   /**
//    * 初始化活动
//    */
//   async init(): Promise<void> {
//     // 等待状态管理器数据加载完成
//     await this.stateManager.initialize();

//     this.renderInitialState();
//     this.bindEvents();
//     this.startTimer();
//     this.checkActivityVisibility();
//   }

//   /**
//    * 刷新活动状态和数据（用于API数据更新后重新渲染）
//    */
//   refreshState(): void {
//     this.renderInitialState();
//   }

//   /**
//    * 检查活动显示状态
//    */
//   private checkActivityVisibility(): void {
//     // 模拟检查活动是否应该显示的逻辑
//     const shouldShow = false; // 可以根据实际需求调整逻辑

//     if (shouldShow) {
//       this.$container.show().addClass("animate-fade-in");
//     }
//   }

//   /**
//    * 渲染初始状态
//    */
//   private async renderInitialState(): Promise<void> {
//     const status = this.stateManager.getCurrentStatus();
//     const data = this.stateManager.getActivityData();

//     this.updateButtonState(status);

//     // 根据状态决定显示倒计时还是进度条
//     if (status === SeckillStatus.NOT_STARTED) {
//       // 活动未开始，显示倒计时，隐藏进度条
//       this.$countdownSection.show();
//       this.$progressSection.hide();
//     } else {
//       // 等待状态管理器数据加载完成
//       await this.stateManager.initialize();
//       // 活动已开始，隐藏倒计时，显示进度条
//       this.$countdownSection.hide();
//       this.$progressSection.show();
//       this.updateProgress(data.grabbedCount, data.totalQuota);
//     }
//   }

//   /**
//    * 绑定事件
//    */
//   private bindEvents(): void {
//     this.$btn.on("click", () => {
//       this.stateManager.debounceClick(() => {
//         this.handleButtonClick();
//       });
//     });
//   }

//   /**
//    * 开始倒计时
//    */
//   private startTimer(): void {
//     this.timer.start(
//       (timeLeft) => this.updateCountdown(timeLeft),
//       () => this.onTimerComplete()
//     );
//   }

//   /**
//    * 更新倒计时显示 - 适配扁平化布局
//    */
//   private updateCountdown(timeLeft: {
//     hours: number;
//     minutes: number;
//     seconds: number;
//   }): void {
//     const $hours = $("#countdown-hours-flat");
//     const $minutes = $("#countdown-minutes-flat");
//     const $seconds = $("#countdown-seconds-flat");

//     // 更新数字（无动画效果）
//     const updateDigit = ($element: any, value: number) => {
//       const newValue = value.toString().padStart(2, "0");
//       $element.text(newValue);
//     };

//     updateDigit($hours, timeLeft.hours);
//     updateDigit($minutes, timeLeft.minutes);
//     updateDigit($seconds, timeLeft.seconds);

//     // 时间紧迫时的特殊样式
//     const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
//     if (totalMinutes < 10) {
//       $(".time-digit-mini").addClass("urgent");
//     } else {
//       $(".time-digit-mini").removeClass("urgent");
//     }
//   }

//   /**
//    * 倒计时完成处理
//    */
//   private onTimerComplete(): void {
//     const isLoggedIn = (window as any).isLoggedIn;
//     const newStatus = isLoggedIn
//       ? SeckillStatus.CAN_SECKILL
//       : SeckillStatus.CAN_QUALIFY;

//     this.stateManager.updateStatus(newStatus);
//     this.updateButtonState(newStatus);

//     // 隐藏倒计时，显示进度条
//     this.$countdownSection.hide();
//     this.$progressSection.show();

//     // 更新进度条显示
//     const data = this.stateManager.getActivityData();
//     this.updateProgress(data.grabbedCount, data.totalQuota);

//     // 按钮闪烁提示
//     this.$btn.addClass("blink");
//     setTimeout(() => this.$btn.removeClass("blink"), 1500);
//   }

//   /**
//    * 更新按钮状态
//    */
//   private updateButtonState(status: SeckillStatus): void {
//     // 清除所有状态类
//     this.$btn.removeClass(
//       "not-started can-qualify can-seckill participated sold-out loading"
//     );

//     const config = this.getButtonConfig(status);
//     this.$btn.addClass(config.className);
//     this.$btnText.text(config.text);
//     this.$tips.html(config.tips);
//   }

//   /**
//    * 获取按钮配置
//    */
//   private getButtonConfig(status: SeckillStatus): {
//     className: string;
//     text: string;
//     tips: string;
//   } {
//     const configs = {
//       [SeckillStatus.NOT_STARTED]: {
//         className: "not-started",
//         text: "即将开始",
//         tips: "活动即将开始，请耐心等待",
//       },
//       [SeckillStatus.CAN_QUALIFY]: {
//         className: "can-qualify",
//         text: "领取资格",
//         tips: "点击领取秒杀资格",
//       },
//       [SeckillStatus.CAN_SECKILL]: {
//         className: "can-seckill",
//         text: "立即领取",
//         tips: "限时秒杀进行中，立即抢购",
//       },
//       [SeckillStatus.PARTICIPATED]: {
//         className: "participated",
//         text: "已领取",
//         tips: "您已成功领取秒杀名额</br>快去<a href='/new/domain-query-register.html' class='text-primary hover:text-primary' target='_blank' rel='noopener'>注册域名</a>吧",
//       },
//       [SeckillStatus.SOLD_OUT]: {
//         className: "sold-out",
//         text: "已抢完",
//         tips: "今日名额已抢完，明日再来",
//       },
//     };

//     return configs[status];
//   }

//   /**
//    * 处理按钮点击
//    */
//   private handleButtonClick(): void {
//     const status = this.stateManager.getCurrentStatus();

//     this.$btn.addClass("btn-click");
//     setTimeout(() => this.$btn.removeClass("btn-click"), 200);

//     switch (status) {
//       case SeckillStatus.CAN_QUALIFY:
//         this.handleQualifyAction();
//         break;
//       case SeckillStatus.CAN_SECKILL:
//         this.handleSeckillAction();
//         break;
//       default:
//         break;
//     }
//   }

//   /**
//    * 处理资格领取
//    */
//   private handleQualifyAction(): void {
//     NotificationManager.show({
//       type: "warning",
//       message: "请先登录后再领取资格",
//     });
//     setTimeout(() => {
//       location.href = `/login.html?ReturnUrl=${location.href}`;
//     }, 2000);
//   }

//   /**
//    * 处理秒杀操作
//    */
//   private async handleSeckillAction(): Promise<void> {
//     try {
//       this.setButtonLoading(true);
//       // 这里请求领取接口
//       const response = (await grabSeckill()) as any;

//       if (response.status === true) {
//         // 成功后更新状态
//         this.stateManager.updateStatus(SeckillStatus.PARTICIPATED);

//         // 更新进度（模拟增加一个已抢数量）
//         const data = this.stateManager.getActivityData();
//         const newGrabbedCount = data.grabbedCount + 1;
//         this.stateManager.updateProgress(newGrabbedCount);
//         this.updateProgress(newGrabbedCount, data.totalQuota);

//         // 显示成功消息
//         NotificationManager.show({
//           type: "success",
//           message: response.msg || "恭喜您！成功领取秒杀名额",
//         });
//       } else {
//         // 失败时显示错误消息
//         NotificationManager.show({
//           type: "error",
//           message: response.msg || "领取失败，请稍后重试",
//         });
//       }
//     } catch (error: any) {
//       NotificationManager.show({
//         type: "error",
//         message: error.message || "网络错误，请稍后重试",
//       });
//     } finally {
//       this.setButtonLoading(false);
//     }
//   }

//   /**
//    * 设置按钮加载状态
//    */
//   private setButtonLoading(loading: boolean): void {
//     if (loading) {
//       this.$btn.addClass("loading");
//       this.$btnLoading.show();
//     } else {
//       this.$btn.removeClass("loading");
//       this.$btnLoading.hide();
//       const status = this.stateManager.getCurrentStatus();
//       this.updateButtonState(status);
//     }
//   }

//   /**
//    * 更新进度条 - 支持百分比显示
//    */
//   private updateProgress(current: number, total: number): void {
//     const percentage = Math.min((current / total) * 100, 100);
//     this.$progressBar.css("width", `${percentage}%`);

//     // 显示百分比
//     if (percentage >= 100) {
//       this.$progressText.text("已抢100%");
//     } else {
//       this.$progressText.text(`已抢${Math.floor(percentage)}%`);
//     }
//   }
// }

/**
 * 组队活动主类
 */
const TeamTableRenderer = {
  /**
   * 检测是否为移动端
   * @returns {boolean}
   */
  isMobile: function () {
    return window.innerWidth <= 500;
  },

  /**
   * 渲染桌面端div表格
   * @param {object[]} teamList - 组队列表数据
   */
  renderDesktopTable: function (teamList: TeamPrice[], type: string) {
    const tableBody = $(
      `.activity-simulated-table.opt-super_discount .table-body`
    );
    if (!tableBody.length) return;

    let tableHtml = "";

    // 渲染产品行
    teamList.forEach((product: any, index) => {
      const leader: any = product.discounts[0];
      const member: any = product.discounts[1];

      const originalPrice: any = parseFloat(product.original_price).toFixed(0);
      const priceLeader: any = parseFloat(leader.discounted_price).toFixed(2);

      const bgClass = index % 2 === 0 ? "bg-one" : "bg-two";

      tableHtml += `
        <div class="table-body-tr ${bgClass}">
          <div class="table-body-td table-left border-left-[1px]">
            <div class="table-left-title">${product.product_name}</div>
          </div>
          <div class="table-body-td bg-[#DBEFDE] border-left-[2px]">
            <div class="table-body-price active">
							<div class="title-desc-wrapper">
								<div class="title-desc">￥</div>
								<div class="title">${priceLeader}</div>
							</div>
              <div class="discount">省最高 ¥${leader.price}</div>
            </div>
          </div>
          <div class="table-body-td bg-[#DBEFDE] border-left-[2px]">
            <div class="table-body-price active">
							<div class="title-desc-wrapper">
								<div class="title-desc">￥</div>
								<div class="title" style="font-size:14px">${member.discounted_price}</div>
							</div>
            </div>
          </div>
          <div class="table-body-td">
            <div class="table-daily-price">
							<div class="title-desc-wrapper">
								<div class="title-desc">最高￥</div>
								<div class="title">${originalPrice}</div>
							</div>
            </div>
          </div>
        </div>
      `;
    });

    // 渲染优惠力度行
    // const lastProduct = teamList[teamList.length - 1];
    // if (lastProduct) {
    //   const tier10: any = lastProduct.discounts.find(
    //     (d: any) => d.member_count === 4
    //   );

    //   tableHtml += `
    //     <div class="table-body-tr bg-one">
    //       <div class="table-body-td table-left border-left-[1px]">
    //         <div class="table-left-title">优惠力度</div>
    //       </div>
    //       <div class="table-body-td bg-[#DBEFDE] border-left-[2px]">
    //         <div class="table-body-price active">
    // 					<div class="title-desc-wrapper">
    // 						<div class="title">约${type === "top" ? "1" : "0.01"}</div>
    // 						<div class="title-desc">折</div>
    // 					</div>
    //         </div>
    //       </div>
    //       <div class="table-body-td">
    //         <div class="table-daily-price">
    //           <div class="title-desc">无折扣</div>
    //         </div>
    //       </div>
    //     </div>
    //   `;
    // }

    // 渲染底部圆角
    // tableHtml += `
    //     <div class="table-body-tr !align-start">
    //         <div class="table-body-td !h-[30px] table-left"></div>
    //         <div class="table-body-td !h-[30px] bg-[#E9F6EB] border-left-[2px] border-bottom-[2px]">
    //         <div class="table-body-td !h-[30px] bg-[#E9F6EB] border-left-[2px] border-bottom-[2px]">
    //         <div class="table-body-td !h-[30px]"></div>
    //         </div>
    //     </div>
    // `;

    tableBody.html(tableHtml);
  },

  /**
   * 渲染移动端原生table
   * @param {object[]} teamList - 组队列表数据
   */
  renderMobileTable: function (teamList: any) {
    const tableContainer = $(".activity-simulated-table");
    if (!tableContainer.length) return;

    // 为移动端添加特殊的类名
    tableContainer.addClass("mobile-table-view");

    let tableHtml = `
      <table class="mobile-team-table">
        <thead>
          <tr>
            <th class="product-col">产品</th>
            <th class="price-col">日常价</th>
            <th class="price-col highlight">4人团</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 渲染产品行
    teamList.forEach((product: any, index: any) => {
      const dailyPrice: any = product.discounts.find(
        (d: any) => d.member_count === 0
      );
      const tier10: any = product.discounts.find(
        (d: any) => d.member_count === 4
      );

      const originalPrice: any = parseFloat(product.original_price).toFixed(0);
      const price10: any = parseFloat(tier10.discounted_price).toFixed(2);

      const rowClass = index % 2 === 0 ? "even-row" : "odd-row";

      tableHtml += `
        <tr class="product-row ${rowClass}">
          <td class="product-name">${product.product_name}</td>
          <td class="daily-price">
            <div class="price-display">
              <span class="currency">¥</span>
              <span class="amount">${originalPrice}</span>
            </div>
          </td>
          <td class="team-price highlight">
            <div class="price-display">
              <span class="currency">¥</span>
              <span class="amount">${price10}</span>
              </div>
              <div class="savings">省最高¥108</div>
          </td>
        </tr>
      `;
    });

    // 渲染优惠力度行
    const lastProduct = teamList[teamList.length - 1];
    if (lastProduct) {
      tableHtml += `
        <tr class="discount-row">
          <td class="product-name">优惠力度</td>
          <td class="daily-price">
            <div class="price-display">
              <span class="no-discount">无折扣</span>
            </div>
          </td>
          <td class="team-price highlight">
            <div class="price-display">
              <span class="discount-rate">约0.01折</span>
            </div>
          </td>
        </tr>
      `;
    }

    tableHtml += `
        </tbody>
      </table>
    `;

    // 替换原有内容
    tableContainer.html(tableHtml);
  },

  /**
   * 渲染活动页的阶梯优惠表格（智能选择渲染方式）
   * @param {object[]} teamList - 组队列表数据
   */
  renderActivityTable: function (teamList: any, type: string) {
    this.renderDesktopTable(teamList, type);
  },

  /**
   * 渲染弹窗内的阶梯优惠表格
   * @param {object[]} teamList - 组队列表数据
   */
  renderModalTable: function (teamList: any, type: string) {
    const modalBody = $(".team-modal-container .team-modal-table-body");
    if (!modalBody.length) return;

    window
      .jQuery(".team-modal-container .btn-confirm")
      .data("type", "super_discount");
    let tableHtml = "";
    teamList.forEach((product: any) => {
      const tier10: any = product.discounts[0];
      const tier4: any = product.discounts[1];

      const price10: any = parseFloat(tier10.discounted_price).toFixed(2);
      const price4: any = parseFloat(tier4.discounted_price).toFixed(2);

      tableHtml += `
        <div class="team-modal-table-row">
            <div class="team-modal-table-cell">${product.product_name}</div>
            <div class="team-modal-table-cell price active"><span>¥</span>${price10}</div>
            <div class="team-modal-table-cell price"><span>¥</span>${price4}</div>
        </div>
      `;
    });
    modalBody.html(tableHtml);
  },

  /**
   * 渲染所有与组队相关的表格
   * @param {object[]} teamList
   */
  renderAll: function (teamList: any, type: string) {
    this.renderActivityTable(teamList, type);
    // Modal table is rendered on demand
  },
};

// ==================== 组队功能 ====================
/**
 * 队伍管理器
 * @namespace TeamManager
 * @description 封装所有与组队功能相关的操作
 */
const TeamManager = {
  /**
   * 更新"我的队伍"弹窗的UI
   * @param {object} teamInfo - 队伍信息
   */
  updateMyTeamModal: function (teamInfo, type) {
    const { team, members, packages } = teamInfo;
    const memberCount = team.member_count;

    // 更新标题
    $("#custom-modal .team-modal-title").text(`我的队伍 (${memberCount}人)`);

    // 更新进度条和里程碑
    const progressPerc = (() => {
      switch (memberCount) {
        case 1:
          return 0;
        case 2:
          return 33.33;
        case 3:
          return 66.66;
        case 4:
          return 100;
        default:
          if (memberCount < 3) return 11.1 * memberCount;
          if (memberCount < 5) return (33.33 / 2 + 33.33).toFixed(2);
          if (memberCount < 10)
            return ((33.33 / 5) * (memberCount - 5) + 66.66).toFixed(2);
          return 100;
      }
    })();

    $("#my-team-progress-bar .progress-line").css("width", `${progressPerc}%`);

    const milestones = { 4: "4人组队" };
    const milestoneDesc = {
      4: "4人组队可获得0.01元.top及超低价.com/.cn购买资格",
    };
    let achievedMilestone = 0;
    for (const count of [4]) {
      const isAchieved = memberCount >= count;
      if (isAchieved) {
        achievedMilestone = count;
      }
      const $milestone = $(
        `#my-team-progress-bar .progress-milestone[data-member="${count}"]`
      );
      $milestone.toggleClass("active", isAchieved);
      $milestone
        .find(".progress-milestone-icon")
        .toggleClass("active", isAchieved);
    }

    const nextMilestone = [4].find((count) => memberCount < count) || 4;

    // 更新里程碑提示信息
    if (achievedMilestone < 4) {
      $("#my-team-milestone-info").html(
        `当前 <strong>${memberCount}</strong> 人，再邀请 <strong>${
          nextMilestone - memberCount
        }</strong> 人即可达标 <strong>【${
          milestones[nextMilestone]
        }目标】</strong><span class="btn-quit refresh-team-icon" data-type="super_discount" data-team-code="${
          team.code
        }"></span>`
      );
      $("#my-team-milestone-desc").text(`${milestoneDesc[nextMilestone]}`);
    } else {
      $("#my-team-milestone-info").html(
        `<strong>恭喜！已达成 4 人组队！</strong>`
      );
      $("#my-team-milestone-desc").text(`每人已获得超低价购买资格`);
      $(".btn-invite")
        .text("队伍已满")
        .css("background-color", "#999")
        .css("color", "#fff")
        .css("cursor", "not-allowed")
        .data("invite-link", ``);
    }

    // 更新成员列表
    const $membersContainer = $("#my-team-members");
    $membersContainer.empty();
    var isCurrentLeader = false;
    members.forEach((member) => {
      const isLeader = member.is_leader === 1;
      const isPresent = member.is_present === 1; //是否为当前用户
      if (isLeader && isPresent) {
        isCurrentLeader = true;
      }
      const memberHtml = `
        <div class="member-item">
          <div class="member-avatar ${isPresent ? "leader" : ""}">
            <img src="/static/new/images/724/avatar.svg" alt="${
              isLeader ? "队长" : "成员"
            }">
          </div>
          <span class="member-label ${isLeader ? "leader-label" : ""}">${
        isPresent ? "我" : isLeader ? "队长" : "队员"
      }</span>
        </div>`;
      $membersContainer.append(memberHtml);
    });

    // 添加 "添加成员" 按钮
    if (memberCount < 4) {
      $membersContainer.append(`
            <div class="member-item add-member-item" data-invite-link="${window.location.origin}/new/domain-register?activity_code=${team.code}">
                <div class="add-member"></div>
                <span class="member-label">添加成员</span>
            </div>
        `);
    }

    // 更新状态文本
    const $status = $("#my-team-status");
    if (achievedMilestone > 0) {
      $status.find("span").text(`${achievedMilestone}人团已达成`);
      $status.find(".status-icon").addClass("active"); // 设置状态图标为激活状态
      $status.find("p").text("已解锁购买资格，快去购买域名吧!");
      $status.addClass("achieved");
    } else {
      $status.find("span").text("未达标");
      $status.find("p").text("继续邀请好友加入");
      $status.removeClass("achieved");
    }

    // 更新优惠券列表
    const $couponSection = $("#claimed-coupons-section");
    const $couponList = $("#claimed-coupons-list");
    const claimedCoupons = packages;

    if (claimedCoupons.length > 0) {
      $couponList.empty();
      claimedCoupons.forEach((coupon) => {
        const couponHtml = `
          <li class="coupon-list-item">
            <div class="coupon-item">
              <div class="coupon-content">
							<div class="coupon-left">
								<div class="coupon-price">${
                  isCurrentLeader ? coupon.over_price_leader : coupon.over_price
                }<span>元</span></div>
								<div class="coupon-name">购买资格</div>
							</div>
							<div class="coupon-right">
								<div class="coupon-title" title="${coupon.product_name}">${
          coupon.product_name
        }</div>
								<div class="coupon-value">满4人发放</div>
							</div>
              </div>
            </div>
          </li>
        `;
        $couponList.append(couponHtml);
      });
      $couponSection.show();
      $("#my-team-qr-section").show();
    } else {
      $couponSection.hide();
      $("#my-team-qr-section").show();
    }

    // 更新二维码和邀请链接
    const inviteLink = `${window.location.origin}/new/domain-register?activity_code=${team.code}`;
    const qrCodeContainer = $("#my-team-qr-code");
    qrCodeContainer.empty(); // 清空旧的二维码，防止重复生成
    new QRCode(qrCodeContainer[0], {
      text: inviteLink,
      width: 120,
      height: 120,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // 更新按钮
    if (memberCount < 4) {
      const $footer = $(".my-team-container .team-modal-footer");
      $footer
        .find(".btn-quit")
        .text("刷新队伍信息")
        .data("team-code", team.code)
        .data("type", "super_discount");
      $footer
        .find(".btn-invite")
        .text("复制组队邀请链接")
        .data(`invite-link`, inviteLink);
    }
  },

  /**
   * 显示"我的队伍"弹窗
   * @param {object} teamInfo - 队伍信息
   */
  showMyTeamModal: function (teamInfo, type) {
    const myTeamModalTemplate = $("#my-team-modal-template").html();
    ModalManager.render(myTeamModalTemplate, { viewClass: "my-team-view" });
    this.updateMyTeamModal(teamInfo, type);
  },

  /**
   * 显示"加入队伍"弹窗
   * @param {object} teamInfo - 目标队伍的信息
   */
  showJoinTeamModal: function (teamInfo, status, type) {
    this.showMyTeamModal(teamInfo, type);
    // 调整为"加入"模式
    const $modal = $("#custom-modal");
    const $footer = $(".my-team-container .team-modal-footer");
    $modal.find(".team-modal-title").text("邀请您加入队伍");
    $modal.find("#my-team-qr-section").hide();
    $modal.find("#claimed-coupons-section").hide();
    $footer.empty();
    if (status == 2) {
      const $footer = $modal.find(".team-modal-footer");
      if (teamInfo.team.member_count === 10) {
        $footer.append(
          `<button class="btn btn-confirm-join" disabled>当前队伍已满员，请加入其他队伍</button>`
        );
      } else {
        $footer.append(
          `<button class="btn btn-confirm-join" data-type="${type}" style="background-color: #20a53a;color: white;">立即加入队伍</button>`
        );
      }
      $footer.find(".btn-confirm-join").data("team-code", teamInfo.team.code);
    } else {
      const $footer = $modal.find(".team-modal-footer");
      $footer.append(
        `<button class="btn btn-confirm-join" disabled>当前已加入队伍，请勿重复加入</button>`
      );
    }
  },
};
/**
 * 显示发起组队模态框
 */
function showTeamModal(type: string) {
  const teamModalTemplate = $("#team-modal-template").html();
  ModalManager.render(teamModalTemplate, { viewClass: "team-view" });
  // 渲染弹窗内表格
  TeamTableRenderer.renderModalTable(getAllTeamPrice(), type);
}

/**
 * 显示组队规则模态框
 */
function showTeamRuleModal(type) {
  const teamRuleModalTemplate = $(`#team-rule-modal-template`).html();
  ModalManager.render(teamRuleModalTemplate, { viewClass: "team-rule-view" });
  setTimeout(() => {
    window.contactWechatService(".rule-customer");
  }, 1000);
}

/**
 * 处理从URL传入的团队邀请码
 * @param {string} code
 */
async function handleTeamUrlCode(code, type) {
  // MessageManager.loading("正在加载队伍信息...");
  $("#initiate-team-btn span").text("加载中...").attr("disabled", true);
  try {
    // 根据邀请码获取团队信息，不管有没有
    // 如果邀请码无效或已过期，此请求会失败，这是一个关键错误，
    const TeamInfo = await ApiService.getTeamInfo(code, 12, !!code);

    // 两个请求都完成后，隐藏加载提示
    // MessageManager.hideLoading();
    $("#initiate-team-btn span").attr("disabled", false);

    // 检查用户是否被邀请加入自己的团队
    if (TeamInfo && TeamInfo.team && code) {
      switch (TeamInfo.team.user_team) {
        case 0:
          TeamManager.showMyTeamModal(TeamInfo, type);
          break;
        case 1:
          TeamManager.showMyTeamModal(TeamInfo, type);
          MessageManager.error("您当前已经加入队伍,无法加入其它队伍");
          break;
        default:
          TeamManager.showJoinTeamModal(
            TeamInfo,
            TeamInfo.team.user_team,
            type
          );
          break;
      }
      // 清除URL中的邀请码
      const cleanUrl = new URL(window.location.href);
      cleanUrl.search = "";
      window.history.replaceState({}, "", cleanUrl);
    }
    return TeamInfo;
  } catch (err) {
    // 捕获 teamInfoFromUrlPromise 的失败（例如，无效的邀请码）
    MessageManager.hideLoading();
    MessageManager.error("无效的邀请码或活动已结束。");
    $("#initiate-team-btn span").text("发起组队").attr("disabled", false);
  } finally {
    // 无论成功或失败，都滚动到团队优惠券部分
    if (code) {
      const $target = $(`#team-coupon.act-super_discount`);
      if ($target.length) {
        $("html, body").animate({ scrollTop: $target.offset().top - 90 }, 500);
      }
    }
  }
}

/**
 * 组队用弹窗管理器
 * @namespace ModalManager
 * @description 封装所有与模态框相关的操作，包括显示、隐藏、渲染和事件绑定。
 */
const ModalManager = {
  modal: null,
  modalContent: null,
  pollingId: null, // 用于跟踪当前的轮询ID

  /**
   * 初始化模态框管理器，获取DOM元素并绑定基础事件。
   * @memberof ModalManager
   */
  init: function () {
    this.modal = $("#custom-modal");
    if (!this.modal.length) {
      console.warn("Modal element #custom-modal not found.");
      return;
    }
    this.modalContent = this.modal.find(".modal-content");

    // 统一处理关闭事件
    this.modal.on("click", ".modal-close", this.hide.bind(this));
    // 点击遮罩层关闭模态框
    // this.modal.on("click", (e) => {
    //   if ($(e.target).is(this.modal)) {
    //     this.hide();
    //   }
    // });
  },

  /**
   * 显示模态框
   * @memberof ModalManager
   * @param {object} [options] - 配置选项
   * @param {string} [options.width] - 模态框宽度
   * @param {string} [options.height] - 模态框高度
   * @param {string} [options.viewClass] - 应用到模态框的附加CSS类
   */
  show: function (options) {
    // 重置样式
    this.modalContent.css({ width: "", height: "" });
    this.modal.removeClass(
      "team-view my-team-view payment-view payment-success-view"
    );

    // 应用自定义尺寸
    if (options && options.width) {
      this.modalContent.css("width", options.width);
    }
    if (options && options.height) {
      this.modalContent.css("height", options.height);
    }
    // 添加视图类
    if (options && options.viewClass) {
      this.modal.addClass(options.viewClass);
    }

    // 显示模态框并添加动画类
    this.modal.show().addClass("show");
  },

  /**
   * 隐藏模态框
   * @memberof ModalManager
   */
  hide: function () {
    this.modal.removeClass("show");
    // 延迟隐藏以显示动画
    setTimeout(() => {
      this.modal.hide();
      this.modal.removeClass(
        "team-view my-team-view payment-view payment-success-view"
      );
      // 清空内容
      this.modal.find(".modal-body").empty();
      // 停止轮询
      if (this.pollingId) {
        stopPolling();
        this.pollingId = null;
      }
    }, 300);
  },

  /**
   * 向模态框中渲染内容并显示
   * @memberof ModalManager
   * @param {string} template - HTML模板字符串
   * @param {object} [options] - showModal的配置项
   */
  render: function (template, options) {
    this.modal.find(".modal-body").html(template);
    this.show(options);
  },
};

// ==================== 组队API 服务 ====================

/**
 * @namespace ApiService
 * @description 负责与后端API进行通信。
 */
const ApiService = {
  baseUrl: `/api/v2/domain_activity_2025`,
  // baseUrl: `${isDev() ? "/devproxy/api" : "/api"}/v2/domain_activity_2025`,

  /**
   * 预留的未登录处理函数
   * @memberof ApiService
   * @private
   */
  _handleUnauthorized: function () {
    // 此处可以调用全局的登录弹窗或跳转到登录页
    MessageManager.error("您尚未登录或登录已过期，即将跳转登录页面。");
    setTimeout(() => {
      window.location.href = "/login.html?ReturnUrl=" + window.location.href;
      localStorage.setItem("activeRedirect", window.location.href);
    }, 2000);
  },

  /**
   * 通用的Ajax请求封装
   * @memberof ApiService
   * @param {string} endpoint - API端点.
   * @param {string} [method='POST'] - HTTP方法.
   * @param {object} [data={}] - 发送的数据.
   * @returns {Promise<any>} - 返回一个Promise，成功时解析为 res 数据，失败时拒绝.
   */
  request: function (
    endpoint,
    method = "POST",
    data = {},
    isShowMessage = true,
    isJumpLogin = false
  ) {
    return new Promise((resolve, reject) => {
      window.jQuery.ajax({
        url: this.baseUrl + endpoint,
        type: method,
        data: JSON.stringify(data),
        headers: {
          "X-UID": "1112",
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: (response) => {
          if (response.success) {
            resolve(response.res);
          } else {
            const errorMessage = response.res || "API返回错误但没有错误信息";
            MessageManager.error(errorMessage);
            reject(errorMessage);
          }
        },
        error: (jqXHR, textStatus, errorThrown) => {
          if (jqXHR.status === 401 && isJumpLogin) {
            this._handleUnauthorized();
            resolve("Unauthorized");
            return;
          }
          // 初始化订单状态查询不弹窗和登录提示
          const filterList = ["/order_status", "/get_team_info"];
          if (filterList.includes(endpoint)) {
            const result = jqXHR.responseJSON ? jqXHR.responseJSON.res : "";
            return resolve(
              jqXHR.status === 401 ? "当前未登录，请先登录" : result
            );
          }
          if (jqXHR.status === 401) {
            this._handleUnauthorized();
            reject("Unauthorized");
            return;
          }

          let errorMessage = "网络错误，请稍后再试。";
          if (jqXHR.responseJSON && jqXHR.responseJSON.res) {
            errorMessage = jqXHR.responseJSON.res;
          }

          MessageManager.error(errorMessage);
          reject(errorMessage);
        },
      });
    });
  },

  /**
   * 获取活动所有信息
   * @memberof ApiService
   * @returns {Promise<object>}
   */
  getActivityInfo: function () {
    return this.request("/get_activity", "POST", {});
  },

  /**
   * 检查订单支付状态
   * @memberof ApiService
   * @param {string} wxoid - 订单号.
   * @returns {Promise<string>}
   */
  checkOrderStatus: function (wxoid) {
    return this.request("/order_status", "POST", { wxoid });
  },

  /**
   * 检查用户是否登录
   * @memberof ApiService
   * @returns {Promise<string>}
   */
  checkLogin: function () {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: "/api/activity/check_login",
        type: "POST",
        data: JSON.stringify({}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: (response) => {
          if (response.success) {
            resolve(response.res);
          } else {
            const errorMessage = response.res || "用户未登录";
            reject(errorMessage);
          }
        },
        error: (jqXHR, textStatus, errorThrown) => {
          if (jqXHR.status !== 401) {
            // this._handleUnauthorized();
          }
          reject("Unauthorized");
        },
      });
    });
  },

  /**
   * 创建支付订单
   * @memberof ApiService
   * @param {object} payload - 订单参数.
   * @returns {Promise<object>}
   */
  createPayment: function (payload, isShowLoading = true) {
    return this.request("/payment", "POST", payload, isShowLoading);
  },

  /**
   * 创建一个新队伍
   * @memberof ApiService
   * @returns {Promise<string>} - 返回队伍邀请码.
   */
  createTeam: function (id) {
    return this.request("/create_team", "POST", { activity: id });
  },

  /**
   * 加入一个队伍
   * @memberof ApiService
   * @param {string} team_code - 队伍邀请码.
   * @returns {Promise<string>}
   */
  joinTeam: function (team_code, id) {
    return this.request("/join_team", "POST", { team_code, activity: id });
  },

  /**
   * 获取队伍详细信息
   * @memberof ApiService
   * @param {string} team_code - 队伍邀请码.
   * @returns {Promise<object>}
   */
  getTeamInfo: function (team_code, id, isJumpLogin = false) {
    return this.request(
      "/get_team_info",
      "POST",
      { team_code, activity: id },
      true,
      isJumpLogin
    );
  },

  /**
   * 领取组队成功的优惠券
   * @memberof ApiService
   * @param {string} team_code - 队伍邀请码.
   * @returns {Promise<string>}
   */
  claimVoucher: function (team_code) {
    return this.request("/get_domain_voucher", "POST", {
      team_code,
      activity: 12,
    });
  },

  /**
   * 获取可用优惠券列表
   * @memberof ApiService
   * @returns {Promise<object[]>}
   */
  getCoupons: function () {
    return this.request("/coupon", "POST", {});
  },
};
/**
 * 组队消息提示管理器
 * @namespace MessageManager
 * @description 负责显示全局提示消息，如成功、失败、警告等。
 */
const MessageManager = {
  container: null,
  loadingOverlay: null,
  icons: {
    success:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"></path></svg>',
    error:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"></path></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"></path></svg>',
    warning:
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"></path></svg>',
  },

  /**
   * 初始化消息管理器，在body中创建容器
   */
  init: function () {
    if ($("#message-container").length === 0) {
      $("body").append('<div id="message-container"></div>');
    }
    this.container = $("#message-container");

    if ($("#message-loading-overlay").length === 0) {
      $("body").append(`
        <div id="message-loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text"></div>
          </div>
        </div>
      `);
    }
    this.loadingOverlay = $("#message-loading-overlay");
  },

  /**
   * 显示一条消息
   * @param {object} options - 配置项
   * @param {string} options.message - 消息内容
   * @param {string} [options.type='info'] - 消息类型 (success, error, info, warning)
   * @param {number} [options.duration=3000] - 显示时长(ms)，0为不自动关闭
   */
  show: function (options) {
    const { message, type = "info", duration = 3000 } = options;

    this.hideLoading();
    const toast = $(`
      <div class="message-toast message-toast-${type}">
        <div class="message-toast-icon">${this.icons[type]}</div>
        <div class="message-toast-content">${message}</div>
      </div>
    `);

    this.container.append(toast);

    // Fade in
    setTimeout(() => {
      toast.addClass("show");
    }, 10); // Small delay for CSS transition

    const closeToast = () => {
      toast.removeClass("show");
      toast.on("transitionend webkitTransitionEnd oTransitionEnd", function () {
        window.jQuery(this).remove();
      });
    };

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(closeToast, duration);
    }

    // Manual close
    // toast.find('.message-toast-close').on('click', closeToast);
  },

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   * @param {number} [duration=3000] - 显示时长
   */
  success: function (message, duration = 3000) {
    this.show({ message, type: "success", duration });
  },

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   * @param {number} [duration=5000] - 显示时长
   */
  error: function (message, duration = 5000) {
    this.show({ message, type: "error", duration });
  },

  /**
   * 显示信息消息
   * @param {string} message - 消息内容
   * @param {number} [duration=3000] - 显示时长
   */
  info: function (message, duration = 3000) {
    this.show({ message, type: "info", duration });
  },

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   * @param {number} [duration=5000] - 显示时长
   */
  warning: function (message, duration = 5000) {
    this.show({ message, type: "warning", duration });
  },

  /**
   * 显示加载中遮罩层
   * @param {string} message - 加载提示文本
   */
  loading: function (message) {
    this.loadingOverlay.find(".loading-text").text(message);
    this.loadingOverlay.addClass("show");
  },

  /**
   * 隐藏加载中遮罩层
   */
  hideLoading: function () {
    this.loadingOverlay.removeClass("show");
  },
};
/**
 * 组队价格数据 - 纯数据对象f
 */
const teamPriceData: TeamPrice[] = [
  {
    product_name: ".top/.xyz/.icu/.cyou",
    original_price: 109,
    discounts: [
      {
        name: "队长",
        discounted_price: 0.01,
        price: 108,
      },
      {
        name: "队员",
        discounted_price: 3.9,
      },
      {
        name: "日常",
        discounted_price: 109,
      },
    ],
  },
  {
    product_name: ".cn",
    original_price: 39,
    discounts: [
      {
        name: "队长",
        discounted_price: 4.9,
        price: 35,
      },
      {
        name: "队员",
        discounted_price: 8.9,
      },
      {
        name: "日常",
        discounted_price: 39,
      },
    ],
  },
  {
    product_name: ".com",
    original_price: 89,
    discounts: [
      {
        name: "队长",
        discounted_price: 39.9,
        price: 50,
      },
      {
        name: "队员",
        discounted_price: 44.9,
      },
      {
        name: "日常",
        discounted_price: 89,
      },
    ],
  },
];

/**
 * 获取所有域名价格数据
 * @returns 所有可展示的域名价格数据列表
 */
const getAllTeamPrice = (): TeamPrice[] => teamPriceData;

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
    firstYearPrice: 13.9,
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
    const $content = window.jQuery(this).next();
    const $icon = window.jQuery(this).find("i");

    $content.toggleClass("hidden");
    $icon.toggleClass("rotate-180");

    $(".faq-toggle")
      .not(this)
      .each(function (this: any) {
        window.jQuery(this).next().addClass("hidden");
        window.jQuery(this).find("i").removeClass("rotate-180");
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
    window
      .jQuery(this)
      .addClass("transition-all duration-700 opacity-0 translate-y-10");
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
    window.location.href = `${
      isDev() ? "" : "/new"
    }/domain-query-register.html?search=${encodeURIComponent(query)}`; // 跳转到注册页并携带查询词
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
    window.jQuery(this).data("userTyped", "true");
    updateClearButtonVisibility();
  });
};

/**
 * 初始化Tab切换功能
 */
const initTabSwitching = (): void => {
  // Tab切换事件
  $("#tab-normal-index, #tab-ai-index").on("click", function (this: any) {
    const $btn = window.jQuery(this);
    const isAiTab = $btn.attr("id") === "tab-ai-index";

    // 切换Tab样式
    $("#tab-normal-index, #tab-ai-index").removeClass("active");
    $btn.addClass("active");

    // 切换面板显示
    if (isAiTab) {
      $("#normal-search-panel-index").addClass("hidden");
      $("#ai-search-panel-index").removeClass("hidden");
    } else {
      $("#ai-search-panel-index").addClass("hidden");
      $("#normal-search-panel-index").removeClass("hidden");
    }
  });
};

/**
 * 初始化AI搜索功能
 */
const initAiSearchEvents = (): void => {
  // AI推荐按钮点击事件
  $("#ai-recommend-btn-index").on("click", function (e: any) {
    e.preventDefault();
    e.stopPropagation();

    const brandName = String($("#brand-name-input-index").val() || "").trim();
    const industry = String($("#industry-input-index").val() || "").trim();

    if (!brandName) {
      NotificationManager.show?.({
        type: "warning",
        message: "请输入品牌/公司/个人/产品名称",
      });
      $("#brand-name-input-index").focus();
      return;
    }

    // 拼接参数跳转到详情页
    const params = new URLSearchParams({
      mode: "ai",
      brand_name: brandName,
      industry: industry || "",
      p: "1",
    });

    window.location.href = `${
      isDev() ? "" : "/new"
    }/domain-query-register.html?${params.toString()}`;
  });

  // AI推荐输入框回车事件
  $("#brand-name-input-index, #industry-input-index").on(
    "keydown",
    function (e: any) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        $("#ai-recommend-btn-index").trigger("click");
      }
    }
  );

  // 阻止AI搜索容器内的form表单提交
  $("#ai-search-panel-index form").on("submit", function (e: any) {
    e.preventDefault();
    return false;
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
        window.jQuery(this).addClass("bg-primary").removeClass("bg-gray-300");
      } else {
        window.jQuery(this).addClass("bg-gray-300").removeClass("bg-primary");
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
    const stepIndex = parseInt(window.jQuery(this).data("step"), 10);
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
// const initSeckillActivity = async (): Promise<void> => {
//   const seckillActivity = new SeckillActivity();
//   await seckillActivity.init();
// };

/**
 * 初始化组队活动
 */
const initTeamActivity = async (): Promise<void> => {
  // 渲染组队得优惠券区域
  TeamTableRenderer.renderAll(getAllTeamPrice(""), "");
  ModalManager.init();
  MessageManager.init();
  // 渲染组队得优惠券区域
  TeamTableRenderer.renderAll(getAllTeamPrice(), "super_discount");

  // ==================== 从API获取并渲染产品数据 ====================
  ApiService.getActivityInfo()
    .then((apiData) => {
      // 处理URL中的邀请码，获取团队信息，不管有没有
      const urlParams = new URLSearchParams(window.location.search);
      const teamCodeFromUrl = urlParams.get("activity_code");
      return handleTeamUrlCode(teamCodeFromUrl, "super_discount");
    })
    .then((info) => {
      if (info && info.team && info.team.code) {
        $(".act-super_discount #initiate-team-btn span").text("查看组队信息");
      } else {
        $(".act-super_discount #initiate-team-btn span").text("发起组队");
      }
    })
    .catch((err) => {
      console.error("加载活动数据或队伍信息失败:", err);
      // 使用本地数据作为回退
      $(".act-super_discount #initiate-team-btn span").text("发起组队");
    })
    .finally(() => {});
  // ==================== 组队功能 ====================
  // 发起组队按钮事件处理
  $(".act-super_discount #initiate-team-btn").on("click", function (e) {
    e.preventDefault();
    MessageManager.loading("正在加载...");
    ApiService.getTeamInfo(null, 12)
      .then((info) => {
        MessageManager.hideLoading();
        if (info && info.team) {
          TeamManager.showMyTeamModal(info, "super_discount");
        } else if (info.includes("未登录")) {
          MessageManager.error("您尚未登录或登录已过期，即将跳转登录页面。");
          setTimeout(() => {
            window.location.href =
              "/login.html?ReturnUrl=" + window.location.href;
          }, 1000);
        } else {
          showTeamModal("super_discount");
        }
      })
      .catch((err) => {
        MessageManager.hideLoading();
        // 没登录会进这里
        MessageManager.error("您尚未登录或登录已过期，即将跳转登录页面。");
        setTimeout(() => {
          window.location.href =
            "/login.html?ReturnUrl=" + window.location.href;
        }, 1000);
      });
  });

  // 组队规则模态框
  $(document).on("click", ".act-super_discount .team-rule-modal", function () {
    showTeamRuleModal("super_discount");
  });

  // 模态框内取消按钮事件处理（委托事件）
  $("#custom-modal").on("click", ".btn-cancel", function () {
    ModalManager.hide();
  });

  // 模态框内确认发起按钮事件处理
  $("#custom-modal").on("click", ".btn-confirm", function () {
    MessageManager.loading("正在创建队伍...");
    ApiService.createTeam(12)
      .then(() => {
        // 创建成功后，获取最新的队伍信息来展示
        return ApiService.getTeamInfo(null, 12);
      })
      .then((newTeamInfo) => {
        MessageManager.success("队伍创建成功！");
        $(".act-super_discount #initiate-team-btn span").text("查看组队信息");
        TeamManager.showMyTeamModal(newTeamInfo, "super_discount");
      })
      .catch((err) => {
        MessageManager.hideLoading();
        // MessageManager.error("创建队伍失败，请重试。");
      });
  });

  // "立即加入队伍"按钮
  $("#custom-modal").on("click", ".btn-confirm-join", function () {
    const teamCode = window.jQuery(this).data("team-code");
    MessageManager.loading("正在加入队伍...");
    ApiService.joinTeam(teamCode, 12)
      .then(() => {
        return ApiService.getTeamInfo(null, 12); // 获取自己最新的队伍信息
      })
      .then((myTeamInfo) => {
        MessageManager.success("成功加入队伍！");
        $(".act-super_discount #initiate-team-btn span").text("查看组队信息");
        TeamManager.showMyTeamModal(myTeamInfo, "super_discount");
      })
      .catch((err) => {
        MessageManager.hideLoading();
        // MessageManager.error("加入队伍失败，您可能已在其他队伍中。");
      });
  });

  // 我的队伍视图中"刷新队伍信息"按钮事件处理(原.btn-quit)
  // 使用节流控制刷新频率，每5秒只能刷新一次
  let lastRefreshTime = 0;
  $("#custom-modal").on(
    "click",
    ".btn-quit[data-type='super_discount']",
    function () {
      const now = Date.now();
      const cooldownPeriod = 5000; // 5秒冷却时间

      if (now - lastRefreshTime < cooldownPeriod) {
        const remainingTime = Math.ceil(
          (cooldownPeriod - (now - lastRefreshTime)) / 1000
        );
        MessageManager.info(`请稍等${remainingTime}秒后再刷新`);
        return;
      }

      lastRefreshTime = now;
      MessageManager.loading("正在刷新...");
      ApiService.getTeamInfo(null, 12)
        .then((info) => {
          MessageManager.hideLoading();
          TeamManager.updateMyTeamModal(info, "super_discount");
          MessageManager.success("队伍信息已更新");
        })
        .catch(() => {
          MessageManager.hideLoading();
          MessageManager.error("刷新失败");
        });
    }
  );

  // 我的队伍视图中"复制组队邀请链接"按钮事件处理(原.btn-invite)
  $("#custom-modal").on("click", ".btn-invite,.add-member-item", function () {
    const link = window.jQuery(this).data("invite-link");
    if (!link) return;

    const clipboard = new Clipboard(this, {
      text: function () {
        return link;
      },
    });

    clipboard.on("success", function (e) {
      MessageManager.success("邀请链接已复制到剪贴板！");
      e.clearSelection();
      clipboard.destroy();
    });

    clipboard.on("error", function (e) {
      MessageManager.error("复制失败，请手动复制。");
      clipboard.destroy();
    });

    // Manually trigger the event
    clipboard.onClick({ currentTarget: this });
  });
};

/**
 * 初始化所有 UI 事件与页面效果
 */
const initUIEvents = async (): Promise<void> => {
  initFaqToggles();
  initPageLoadAnimations();
  initDomainQueryEvents();
  initTabSwitching(); // 初始化Tab切换功能
  initAiSearchEvents(); // 初始化AI搜索功能
  initStepSwitcher();
  initTypewriterEffect();
  initPriceTable();
  initScrollToSearchButton();
  initServiceQRCode();
  initCartButton();
  // 异步初始化秒杀活动，等待API数据加载
  // await initSeckillActivity();
  await initTeamActivity(); // 组队活动初始化
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

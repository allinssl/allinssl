export type SeckillActivityInfoResponseData = {
	// 是否可以抢券，false表示不可抢
	can_grab: boolean;
	// 优惠券价格，单位：元
	coupon_price: string;
	// 当前系统时间
	current_time: string;
	// 活动描述
	description: string;
	// 活动结束时间
	end_time: string;
	// 抢券状态：0=可抢，1=已抢到未使用，2=已使用，3=活动未开始，4=活动已结束，5=已抢完
	grab_status: number;
	// 是否有活动，true表示有活动
	has_activity: boolean;
	// 剩余优惠券数量
	remaining_coupons: number;
	// 活动开始时间
	start_time: string;
	// 状态文本描述
	status_text: string;
	// 总优惠券数量
	total_coupons: number;
	// 用户优惠券状态
	user_coupon: {
		// 0: 未领取，1: 已领取，2: 已使用
		status: number; 
	};
};
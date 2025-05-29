import { $t } from '@locales/index'

export default {
	sortRoute: [
		{ name: 'home', title: $t('t_0_1744258111441') },
		{ name: 'autoDeploy', title: $t('t_1_1744258113857') },
		{ name: 'certManage', title: $t('t_2_1744258111238') },
		{ name: 'certApply', title: $t('t_3_1744258111182') },
		{ name: 'authApiManage', title: $t('t_4_1744258111238') },
		{ name: 'monitor', title: $t('t_5_1744258110516') },
		{ name: 'settings', title: $t('t_6_1744258111153') },
	], // 路由排序
	frameworkRoute: ['layout'], // 框架路由
	systemRoute: ['login', '404'], // 系统路由
	disabledRoute: [], // 禁用路由
}

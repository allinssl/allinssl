import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 用户列表 (案例接口)
export const listUser = Mock.mock(
	/\/api\/user\/list/,
	'post',
	listTemplate(
		{
			id: '@id',
			name: '@cname',
			avatar: '@image',
			'age|18-60': 18,
			'gender|1': ['男', '女'],
			phone: /^1[385][1-9]\d{8}/,
			email: '@EMAIL',
			address: '@county(true)',
			'role|1': ['admin', 'user'],
		},
		100,
	),
)

// 用户详情 (案例接口)
export const addUser = Mock.mock(/\/api\/user\/add/, 'post', messageTemplate('添加成功', true))


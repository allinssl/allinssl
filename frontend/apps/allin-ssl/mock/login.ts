import Mock from 'mockjs'
import { listTemplate, messageTemplate } from './template'

// 登录
export const login = Mock.mock(/\/login\/login/, 'post', () => ({
	code: 0,
	count: 0,
	data: {
		token:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNjE0NjE5MDQ2LCJleHAiOjE2MTQ3MDU0NDZ9._QS2nQa2FRpqH7zJSnjYVBXCOp7-QR-zrXsHl6dTHaU',
	},
	message: '登录成功',
	status: true,
}))

import { describe, it, expect } from 'vitest'
import * as businessUtils from '../src/business'

describe('业务工具函数测试', () => {
	describe('正则验证测试', () => {
		describe('邮箱验证', () => {
			it.each([
				['valid@email.com', true],
				['invalid.email', false],
				['test@test.cn', true],
				['@invalid.com', false],
				['test@.com', false],
			])('应当正确验证邮箱 %s', (email, expected) => {
				expect(businessUtils.isEmail(email)).toBe(expected)
			})
		})

		describe('手机号验证', () => {
			it.each([
				['13812345678', true],
				['12345678901', false],
				['19912345678', true],
				['1381234567', false],
				['138123456789', false],
			])('应当正确验证手机号 %s', (phone, expected) => {
				expect(businessUtils.isPhone(phone)).toBe(expected)
			})
		})

		describe('身份证号验证', () => {
			it.each([
				['440101199001011234', true],
				['44010119900101123X', true],
				['440101199001011', false],
				['44010119900101123Y', false],
			])('应当正确验证身份证号 %s', (idCard, expected) => {
				expect(businessUtils.isIdCard(idCard)).toBe(expected)
			})
		})

		describe('URL验证', () => {
			it.each([
				['https://www.example.com', true],
				['http://localhost:3000', true],
				['ftp://files.example.com', true],
				['invalid-url', false],
			])('应当正确验证URL %s', (url, expected) => {
				expect(businessUtils.isUrl(url)).toBe(expected)
			})
		})

		describe('IP地址验证', () => {
			describe('IPv4验证', () => {
				it.each([
					['192.168.1.1', true],
					['256.1.2.3', false],
					['1.2.3.4', true],
					['192.168.001.1', false],
				])('应当正确验证IPv4地址 %s', (ip, expected) => {
					expect(businessUtils.isIpv4(ip)).toBe(expected)
				})
			})

			describe('IPv6验证', () => {
				it.each([
					['2001:0db8:85a3:0000:0000:8a2e:0370:7334', true],
					['fe80::1', true],
					['::1', true],
					['2001::7334', true],
					['invalid-ipv6', false],
				])('应当正确验证IPv6地址 %s', (ip, expected) => {
					expect(businessUtils.isIpv6(ip)).toBe(expected)
				})
			})
		})

		describe('MAC地址验证', () => {
			it.each([
				['00-B0-D0-63-C2-26', true],
				['00-b0-d0-63-c2-26', true],
				['00:B0:D0:63:C2:26', false],
				['00-B0-D0-63-C2', false],
			])('应当正确验证MAC地址 %s', (mac, expected) => {
				expect(businessUtils.isMac(mac)).toBe(expected)
			})
		})

		describe('中文验证', () => {
			it.each([
				['中文', true],
				['中文123', false],
				['Chinese', false],
				['中文！', false],
			])('应当正确验证中文 %s', (str, expected) => {
				expect(businessUtils.isChinese(str)).toBe(expected)
			})
		})
	})

	describe('业务操作测试', () => {
		describe('手机号加密', () => {
			it('应当正确加密手机号', () => {
				expect(businessUtils.encryptPhone('13812345678')).toBe('138****5678')
			})
		})

		describe('身份证号加密', () => {
			it('应当正确加密身份证号', () => {
				expect(businessUtils.encryptIdCard('440101199001011234')).toBe('440101****1234')
				expect(businessUtils.encryptIdCard('44010119900101123X')).toBe('440101****123X')
			})
		})

		describe('版本号比较', () => {
			it.each([
				['1.0.0', '1.0.1', -1],
				['1.0.1', '1.0.0', 1],
				['1.0.0', '1.0.0', 0],
				['1.0', '1.0.0', 0],
				['1.0.0', '1', 0],
				['1.1', '1.0.1', 1],
			])('比较版本号 %s 和 %s 应当返回 %i', (v1, v2, expected) => {
				expect(businessUtils.compareVersion(v1, v2)).toBe(expected)
			})
		})

		describe('字节转换', () => {
			it.each([
				[0, 2, true, '', '0 B'],
				[1024, 0, true, '', '1 KB'],
				[1024 * 1024, 2, true, '', '1.00 MB'],
				[1024 * 1024 * 1024, 0, true, '', '1 GB'],
				[1500, 2, true, 'KB', '1.46 KB'],
				[1500, 2, false, 'KB', '1.46'],
			])('转换 %i 字节应当返回 %s', (bytes, fixed, isUnit, endUnit, expected) => {
				expect(businessUtils.formatBytes(bytes, fixed, isUnit, endUnit)).toBe(expected)
			})
		})

		describe('分页字符串转换', () => {
			it.each([
				["class='Pcount'>共100条<", 100],
				["class='Pcount'>共0条<", 0],
				['invalid string', 0],
			])('应当正确转换分页字符串 %s', (page, expected) => {
				expect(businessUtils.formatPage(page)).toBe(expected)
			})
		})
	})

	describe('代理配置测试', () => {
		it('应当正确生成params格式的代理配置', () => {
			const config = businessUtils.getProxyConfig('test-key', 'params') as {
				request_time: number
				request_token: string
			}
			expect(config).toHaveProperty('request_time')
			expect(config).toHaveProperty('request_token')
			expect(typeof config.request_time).toBe('number')
			expect(typeof config.request_token).toBe('string')
		})

		it('应当正确生成query格式的代理配置', () => {
			const config = businessUtils.getProxyConfig('test-key', 'query')
			expect(typeof config).toBe('string')
			expect(config).toMatch(/request_time=\d+&request_token=[a-f0-9]+/)
		})
	})
})

import { describe, it, expect } from 'vitest'
import * as encipherUtils from '../src/encipher'

describe('加密解密工具函数测试', () => {
	const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArWtsSxxqzT8X9D3yVF12
6WHBd+6WZw1TSoatATB6djpe05xwPKOFrNSbOz/tqm6zOhv47w8roO8p978XmHiv
fOuYZxAoCCJUZBG5BxMgEcO5uwue/ll1Hp5VaxvI52Vnuoh9HLx8LpxB0FPXvAjm
cJ7pvgs8Tnox8o2idWN25D1HTeITME+9wBcs7aubNFoUczFDk5+q33mW+i31C30r
DK9/j0odoy0NYGA5DxQiOWpqK3ljaO+40XWYqbWBfq+9LeTPMKT8UARxiSTXumKL
R5p35l0B1CoqpedhszPFvfHzpIPHSzk+uDAwMdR7EprrGinYzOTiTs/wy/ggOICe
uwIDAQAB
-----END PUBLIC KEY-----`

	const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCta2xLHGrNPxf0
PfJUXXbpYcF37pZnDVNKhq0BMHp2Ol7TnHA8o4Ws1Js7P+2qbrM6G/jvDyug7yn3
vxeYeK9865hnECgIIlRkEbkHEyARw7m7C57+WXUenlVrG8jnZWe6iH0cvHwunEHQ
U9e8COZwnum+CzxOejHyjaJ1Y3bkPUdN4hMwT73AFyztq5s0WhRzMUOTn6rfeZb6
LfULfSsMr3+PSh2jLQ1gYDkPFCI5amoreWNo77jRdZiptYF+r70t5M8wpPxQBHGJ
JNe6YotHmnfmXQHUKiql52GzM8W98fOkg8dLOT64MDAx1HsSmusaKdjM5OJOz/DL
+CA4gJ67AgMBAAECggEAPS0LC8gfiP375kZACTDbdOLuS++XkQzrV/wAZc4DNVfM
AdxK36lTy69If3NC1P+uLA6YF0UDwAb+iA4aNchFJ804ewsBBDWQDakO24cMphek
mm40DUfjgASc32byzWZBXFUvxYZcTFkFAofBL+z31bzJeigegxSqMAV0zPJki4jZ
pWLiVYiIQ+SSG75mr/c9VJdTV7/kekNpkaXmTaVRSfKqROQpV7niknWnuNYSUGUF
apY7JbEJiIOdB6Tc6aGIXzAAlr3klCF22cTTBbBrP3kDGm2Bmr2Hqrxe5I0Eo05j
9Su+TiH26tBG4/FoMm6l3nT8O2fjntv1eXUuvluLOQKBgQDcB4oCP4f/bIysns8u
dGsdsvoZ/e57QVHcRn5G8A7KYma5uJ96Ll0eWgSLoH3wZ2YuRbqrQX7Y3dvfAd6I
LvB6lOJ6bpDc5bn3wvGXb6qF/9h/m2HIyepE9B7m5omXCZ4tFiThbUX1m/TrhzW8
IWKe8qY25FuIji9thzrFbCdGTQKBgQDJxTbWuXMAv9lojXwu73XPMDlgt5LG0eEK
S4QYxMm7VEHtXQ54q8ExKTETuzcTHADqBBEx7/Zhlv6Bxxbe7ghjHI3Mv+F7T5qq
5zZ8n62c0UWttd0XqbC3jLtiX3wMtM2WnUGdgWA4/YBbWlj7x6cuO8ptL027hR/k
/ta1vz8NJwKBgCBFSsyBnOStewRmVmSt1ngIo/3j7HJPZj40aJjm5IRyYjajCWDW
I/orobcI1u/HeokW2QX9GSmdgH34vDalC8guxfjG9qAvYVMhWGWpjw0QNSSiGXll
g+KRG2cqMMviMTzTnp0hdb1MHmPc9Nie3OQLGq26WGJy2CnsR4ZlEm2RAoGBALof
0Xl8MskDMKNQuLh3Lp7EZnmAfcYn/0bG6IEMrua+T96NE/dewOT/kYUZEzHuiC1X
OSFusUHOztGafM+ClnwO8ANrEa31fcCfbtTBW56oMXWPqPbWEu0OxiB14nG6K1f/
knKf0MphlpEuo50GzIJKp23W0AbmQ8izCA857wjLAoGAYqCMYuQuLWu/0WNyRR7z
ia3CeKh2L8Y/0IhXAqwMFwxZgbHKc9Bw2Q/Vqj45ERhMQntDDzVeUhZZVXVnmWsj
58YF7VfNOok4B0UU4uOGus6XYsAD4mm9gTiaFijPIFY1icd9p8wl7MmVWBlvtqmE
SQK1rJJCb92DHknrKmUUj0o=
-----END RSA PRIVATE KEY-----

`

	describe('rsaEncrypt', () => {
		it('应当正确加密字符串', () => {
			const text = 'Hello World'
			const encrypted = encipherUtils.rsaEncrypt(text, publicKey)
			expect(encrypted).toBeTruthy()
			expect(encrypted).not.toBe(text)
		})

		it('当公钥无效时应当返回原文', () => {
			const text = 'Hello World'
			expect(encipherUtils.rsaEncrypt(text, '')).toBe(text)
		})
	})

	describe('rsaDecrypt', () => {
		it('应当正确解密字符串', () => {
			const text = 'Hello World'
			const encrypted = encipherUtils.rsaEncrypt(text, publicKey)
			const decrypted = encipherUtils.rsaDecrypt(encrypted, privateKey)
			expect(decrypted).toBe(text)
		})

		it('当私钥无效时应当返回原文', () => {
			const text = 'Hello World'
			expect(encipherUtils.rsaDecrypt(text, '')).toBe(text)
		})
	})

	describe('加密解密集成测试', () => {
		it('应当能够正确完成加密解密循环', () => {
			const testCases = ['Hello World', '123456', 'Special @#$% Characters', '中文测试']

			testCases.forEach((text) => {
				const encrypted = encipherUtils.rsaEncrypt(text, publicKey)
				const decrypted = encipherUtils.rsaDecrypt(encrypted, privateKey)
				expect(decrypted).toBe(text)
			})
		})
	})
})

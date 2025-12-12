/**
 * 文件定义：加密解密
 */

// import JSEncrypt from 'jsencrypt'
/* -------------- 1、加密解密 -------------- */

/**
 * 生成2048位RSA密钥对
 * @returns {{ publicKey: string, privateKey: string }} 包含公钥和私钥的对象
 */
export const generateKeyPair = async () => {
	const { JSEncrypt } = await import('jsencrypt')
	const encrypt = new JSEncrypt({ default_key_size: '2048' })
	encrypt.getKey()

	return {
		publicKey: encrypt.getPublicKey() as string,
		privateKey: encrypt.getPrivateKey() as string,
	}
}

/**
 * RSA加密
 * @param {string} str - 需要加密的字符串
 * @param {string} publicKey - 公钥
 * @returns {string} 加密后的字符串
 */
export const rsaEncrypt = async (str: string, publicKey: string): Promise<string> => {
	const { JSEncrypt } = await import('jsencrypt')
	// 基础验证
	if (!str || !publicKey || publicKey.length < 10) return str
	// 检查字符串长度（2048位RSA密钥最大可加密245字节）
	const byteLength = new TextEncoder().encode(str).length
	if (byteLength > 245) {
		console.error('RSA加密失败: 数据长度超过245字节限制')
		return str
	}

	try {
		const encrypt = new JSEncrypt()
		encrypt.setPublicKey(publicKey)
		const encrypted = encrypt.encrypt(str)

		// 确保加密结果有效
		if (!encrypted) {
			console.error('RSA加密失败')
			return str
		}

		return encrypted
	} catch (error) {
		console.error('RSA加密出错:', error)
		return str
	}
}

/**
 * RSA解密
 * @param {string} str - 需要解密的字符串
 * @param {string} privateKey - 私钥
 * @returns {string} 解密后的字符串
 */
export const rsaDecrypt = async (str: string, privateKey: string): Promise<string> => {
	const { JSEncrypt } = await import('jsencrypt')

	// 基础验证
	if (!str || !privateKey || privateKey.length < 10) return str

	try {
		const decrypt = new JSEncrypt()
		decrypt.setPrivateKey(privateKey)
		const decrypted = decrypt.decrypt(str)

		// 确保解密结果有效
		if (!decrypted) {
			console.error('RSA解密失败')
			return str
		}

		return decrypted
	} catch (error) {
		console.error('RSA解密出错:', error)
		return str
	}
}

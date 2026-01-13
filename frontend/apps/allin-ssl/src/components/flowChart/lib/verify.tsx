import { ref, onUnmounted } from 'vue'
import { ValidatorResult, ValidatorFunction, RuleItem, ValidatorDescriptor } from '../types'

/**
 * 验证器类
 * 用于管理所有节点的验证函数和验证结果
 */
class Validator {
	// 存储所有节点的验证函数
	private validators: Map<string, ValidatorFunction> = new Map()
	// 存储所有节点的验证结果
	private validationResults: Map<string, ValidatorResult> = new Map()
	// 存储所有节点的数据
	private valuesMap: Map<string, any> = new Map()
	// 存储节点规则验证状态
	public rulesMap: Map<string, boolean> = new Map()

	/**
	 * 注册验证器
	 * @param nodeId - 节点ID
	 * @param validator - 验证函数
	 */
	register(nodeId: string, validator: ValidatorFunction) {
		this.validators.set(nodeId, validator)
		this.validate(nodeId)
	}

	/**
	 * 注销验证器
	 * @param nodeId - 节点ID
	 */
	unregister(nodeId: string) {
		this.validators.delete(nodeId)
		this.validationResults.delete(nodeId)
		this.valuesMap.delete(nodeId)
	}

	unregisterAll() {
		this.validators.clear()
		this.validationResults.clear()
		this.valuesMap.clear()
	}

	/**
	 * 注册兼容async-validator的规则
	 * @param nodeId - 节点ID
	 * @param descriptor - 验证规则描述符
	 * @param initialValues - 初始值
	 */
	registerCompatValidator(nodeId: string, descriptor: ValidatorDescriptor, initialValues?: Record<string, any>) {
		if (initialValues) {
			this.valuesMap.set(nodeId, { ...initialValues })
		} else {
			this.valuesMap.set(nodeId, {})
		}

		const validator = () => {
			return this.validateWithRules(nodeId, descriptor)
		}
		this.validators.set(nodeId, validator)
	}

	/**
	 * 设置节点的值
	 * @param nodeId - 节点ID
	 * @param key - 属性名
	 * @param value - 属性值
	 */
	setValue(nodeId: string, key: string, value: any) {
		const values = this.valuesMap.get(nodeId) || {}
		values[key] = value
		this.valuesMap.set(nodeId, values)
	}

	/**
	 * 批量设置节点的值
	 * @param nodeId - 节点ID
	 * @param values - 属性值集合
	 */
	setValues(nodeId: string, values: Record<string, any>) {
		const currentValues = this.valuesMap.get(nodeId) || {}
		this.valuesMap.set(nodeId, { ...currentValues, ...values })
	}

	/**
	 * 获取节点的值
	 * @param nodeId - 节点ID
	 * @param key - 属性名
	 */
	getValue(nodeId: string, key: string) {
		const values = this.valuesMap.get(nodeId) || {}
		return values[key]
	}

	/**
	 * 获取节点的所有值
	 * @param nodeId - 节点ID
	 */
	getValues(nodeId: string) {
		return this.valuesMap.get(nodeId) || {}
	}

	/**
	 * 使用兼容async-validator的规则验证数据
	 * @param nodeId - 节点ID
	 * @param descriptor - 验证规则描述符
	 * @returns 验证结果
	 */
	validateWithRules(nodeId: string, descriptor: ValidatorDescriptor): ValidatorResult {
		const values = this.valuesMap.get(nodeId) || {}
		for (const field in descriptor) {
			const rules = Array.isArray(descriptor[field])
				? (descriptor[field] as RuleItem[])
				: [descriptor[field] as RuleItem]
			const value = values[field]
			if (field in values) {
				for (const rule of rules) {
					// 检查必填
					if (rule.required && (value === undefined || value === null || value === '')) {
						const message = rule.message || `${field}是必填项`
						return { valid: false, message }
					}

					// 如果值为空但不是必填，则跳过其他验证
					if ((value === undefined || value === null || value === '') && !rule.required) {
						continue
					}

					// 检查类型
					if (rule.type && !this.validateType(rule.type, value)) {
						const message = rule.message || `${field}的类型应为${rule.type}`
						return { valid: false, message }
					}

					// 检查格式
					if (rule.pattern && !rule.pattern.test(String(value))) {
						const message = rule.message || `${field}格式不正确`
						return { valid: false, message }
					}

					// 检查长度范围
					if (rule.type === 'string' || rule.type === 'array') {
						const length = value.length || 0

						if (rule.len !== undefined && length !== rule.len) {
							const message = rule.message || `${field}的长度应为${rule.len}`
							return { valid: false, message }
						}

						if (rule.min !== undefined && length < rule.min) {
							const message = rule.message || `${field}的长度不应小于${rule.min}`
							return { valid: false, message }
						}

						if (rule.max !== undefined && length > rule.max) {
							const message = rule.message || `${field}的长度不应大于${rule.max}`
							return { valid: false, message }
						}
					}

					// 检查数值范围
					if (rule.type === 'number') {
						if (rule.len !== undefined && value !== rule.len) {
							const message = rule.message || `${field}应等于${rule.len}`
							return { valid: false, message }
						}

						if (rule.min !== undefined && value < rule.min) {
							const message = rule.message || `${field}不应小于${rule.min}`
							return { valid: false, message }
						}

						if (rule.max !== undefined && value > rule.max) {
							const message = rule.message || `${field}不应大于${rule.max}`
							return { valid: false, message }
						}
					}

					// 检查枚举值
					if (rule.enum && !rule.enum.includes(value)) {
						const message = rule.message || `${field}的值不在允许范围内`
						return { valid: false, message }
					}

					// 检查空白字符
					if (rule.whitespace && rule.type === 'string' && !value.trim()) {
						const message = rule.message || `${field}不能只包含空白字符`
						return { valid: false, message }
					}

					// 自定义验证器
					if (rule.validator) {
						try {
							const result = rule.validator(rule, value, undefined)

							if (result === false) {
								const message = rule.message || `${field}验证失败`
								return { valid: false, message }
							}

							if (result instanceof Error) {
								return { valid: false, message: result.message }
							}

							if (Array.isArray(result) && result.length > 0 && result[0] instanceof Error) {
								return { valid: false, message: result[0].message }
							}
						} catch (error) {
							return { valid: false, message: error instanceof Error ? error.message : `${field}验证出错` }
						}
					}
				}
			}
		}
		return { valid: true, message: '' }
	}

	/**
	 * 验证值的类型
	 * @param type - 类型
	 * @param value - 值
	 * @returns 是否通过验证
	 */
	private validateType(type: string, value: any): boolean {
		switch (type) {
			case 'string':
				return typeof value === 'string'
			case 'number':
				return typeof value === 'number' && !isNaN(value)
			case 'boolean':
				return typeof value === 'boolean'
			case 'method':
				return typeof value === 'function'
			case 'regexp':
				return value instanceof RegExp
			case 'integer':
				return typeof value === 'number' && Number.isInteger(value)
			case 'float':
				return typeof value === 'number' && !Number.isInteger(value)
			case 'array':
				return Array.isArray(value)
			case 'object':
				return typeof value === 'object' && !Array.isArray(value) && value !== null
			case 'enum':
				return true // 枚举类型在单独的规则中验证
			case 'date':
				return value instanceof Date
			case 'url':
				try {
					new URL(value)
					return true
				} catch (e) {
					return false
				}
			case 'email':
				return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
			default:
				return true
		}
	}

	/**
	 * 验证指定节点
	 * @param nodeId - 节点ID
	 * @returns ValidatorResult - 验证结果
	 */
	validate(nodeId: string) {
		const validator = this.validators.get(nodeId)
		if (validator) {
			const result = validator()
			this.validationResults.set(nodeId, result)
			return result
		}
		return { valid: false, message: '' }
	}

	/**
	 * 验证所有已注册的节点
	 * @returns 包含所有节点验证结果的对象
	 */
	validateAll() {
		let allValid = true
		const results: Record<string, ValidatorResult> = {}
		this.validators.forEach((validator, nodeId) => {
			const result = this.validate(nodeId)
			results[nodeId] = result
			if (!result.valid) {
				allValid = false
			}
		})
		return {
			valid: allValid,
			results,
		}
	}

	/**
	 * 获取指定节点的验证结果
	 * @param nodeId - 节点ID
	 * @returns ValidatorResult - 验证结果
	 */
	getValidationResult(nodeId: string): ValidatorResult {
		return this.validationResults.get(nodeId) || { valid: true, message: '' }
	}
}

// 创建全局验证器实例
const validator = new Validator()

/**
 * 节点验证器 Hook
 * 提供节点验证相关的功能
 * @returns 包含验证相关方法和状态的对象
 */
export function useNodeValidator() {
	// 响应式的验证结果
	const validationResult = ref<ValidatorResult>({ valid: false, message: '' })

	/**
	 * 注册验证器函数
	 * @param nodeId - 节点ID
	 * @param validateFn - 验证函数
	 */
	const registerValidator = (nodeId: string, validateFn: ValidatorFunction) => {
		validator.register(nodeId, validateFn)
		validationResult.value = validator.getValidationResult(nodeId)
	}

	/**
	 * 注册兼容async-validator的规则
	 * @param nodeId - 节点ID
	 * @param descriptor - 验证规则描述符
	 * @param initialValues - 初始值
	 */
	const registerCompatValidator = (
		nodeId: string,
		descriptor: ValidatorDescriptor,
		initialValues?: Record<string, any>,
	) => {
		validator.registerCompatValidator(nodeId, descriptor, initialValues)
		validationResult.value = validator.getValidationResult(nodeId)
	}

	/**
	 * 设置字段值
	 * @param nodeId - 节点ID
	 * @param key - 字段名
	 * @param value - 字段值
	 */
	const setFieldValue = (nodeId: string, key: string, value: any) => {
		validator.setValue(nodeId, key, value)
	}

	/**
	 * 批量设置字段值
	 * @param nodeId - 节点ID
	 * @param values - 字段值集合
	 */
	const setFieldValues = (nodeId: string, values: Record<string, any>) => {
		validator.setValues(nodeId, values)
	}

	/**
	 * 获取字段值
	 * @param nodeId - 节点ID
	 * @param key - 字段名
	 */
	const getFieldValue = (nodeId: string, key: string) => {
		return validator.getValue(nodeId, key)
	}

	/**
	 * 获取所有字段值
	 * @param nodeId - 节点ID
	 */
	const getFieldValues = (nodeId: string) => {
		return validator.getValues(nodeId)
	}

	/**
	 * 执行验证
	 * @param nodeId - 节点ID
	 * @returns ValidatorResult - 验证结果
	 */
	const validate = (nodeId: string) => {
		const result = validator.validate(nodeId)
		validationResult.value = result
		return result
	}

	/**
	 * 注销验证器
	 * @param nodeId - 节点ID
	 */
	const unregisterValidator = (nodeId: string) => {
		validator.unregister(nodeId)
	}

	return {
		validationResult, // 验证结果（响应式）
		registerValidator, // 注册验证器方法
		registerCompatValidator, // 注册兼容async-validator的规则
		setFieldValue, // 设置字段值
		setFieldValues, // 批量设置字段值
		getFieldValue, // 获取字段值
		getFieldValues, // 获取所有字段值
		validate, // 执行验证方法
		unregisterValidator, // 注销验证器方法
		validator, // 验证器实例
	}
}

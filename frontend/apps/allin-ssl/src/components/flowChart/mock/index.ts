export default {
	name: '',
	childNode: {
		id: 'start-1',
		name: '开始',
		type: 'start',
		config: {
			exec_type: 'auto',
			type: 'day',
			hour: 1,
			minute: 0,
		},
		childNode: {
			id: 'apply-1',
			name: '申请证书',
			type: 'apply',
			config: {
				domains: '',
				email: '',
				provider_id: '',
				provider: '',
				end_day: 30,
			},
			childNode: {
				id: 'deploy-1',
				name: '部署',
				type: 'deploy',
				inputs: [],
				config: {
					provider: '',
					provider_id: '',
					inputs: {
						fromNodeId: '',
						name: '',
					},
				},
				childNode: {
					id: 'execute',
					name: '执行结果',
					type: 'execute_result_branch',
					config: { fromNodeId: 'deploy-1' },
					conditionNodes: [
						{
							id: 'execute-success',
							name: '执行成功',
							type: 'execute_result_condition',
							config: {
								fromNodeId: '',
								type: 'success',
							},
						},
						{
							id: 'execute-failure',
							name: '执行失败',
							type: 'execute_result_condition',
							config: {
								fromNodeId: '',
								type: 'fail',
							},
						},
					],
					childNode: {
						id: 'notify-1',
						name: '通知任务',
						type: 'notify',
						config: {
							provider: '',
							provider_id: '',
							subject: '',
							body: '',
						},
					},
				},
			},
		},
	},
}

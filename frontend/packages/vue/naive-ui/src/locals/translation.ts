// 定义完整的基准模板结构
type TranslationTemplate = {
	useModal: {
		cannotClose: string
		cancel: string
		confirm: string
	}
	useBatch: {
		batchOperation: string
		selectedItems: (count: number) => string
		startBatch: string
		placeholder: string
	}
	useForm: {
		submit: string
		reset: string
		expand: string
		collapse: string
		moreConfig: string
		help: string
		required: string
		placeholder: (label: string) => string
	}
	useFullScreen: {
		exit: string
		enter: string
	}
	useTable: {
		operation: string
		columnSettings: string
		showColumn: string
		hideColumn: string
		resetColumns: string
		allColumns: string
	}
}

/**
 * @description 格式化字符串，将传入的变量依次插入 `{}` 占位符
 * @param {string} template 需要格式化的字符串，使用 `{}` 作为占位符
 * @param  {...any} values 需要插入的多个变量
 * @returns {string} 格式化后的字符串
 * @example
 *   formatString("你好，我是 {}，今年 {} 岁", "小明", 25);
 *   // 返回："你好，我是 小明，今年 25 岁"
 */
const formatString = (template: string, ...values: any[]) => {
	let index = 0
	return template.replace(/\{\}/g, () => (values[index] !== undefined ? values[index++] : ''))
}

// 创建语言翻译生成器函数
const createTranslation = <T = TranslationTemplate>(translation: T): T => translation

/**
 * 国际化翻译
 */
export const translation = {
	zhCN: createTranslation({
		useModal: {
			cannotClose: '当前状态无法关闭弹窗',
			cancel: '取消',
			confirm: '确认',
		},
		useBatch: {
			batchOperation: '批量操作',
			selectedItems: (count: number) => formatString('已选择 {} 项', count),
			startBatch: '开始批量操作',
			placeholder: '请选择操作',
		},
		useForm: {
			submit: '提交',
			reset: '重置',
			expand: '展开',
			collapse: '收起',
			moreConfig: '更多配置',
			help: '帮助文档',
			required: '必填项',
			placeholder: (label: string) => formatString('请输入{}', label),
		},
		useFullScreen: {
			exit: '退出全屏',
			enter: '进入全屏',
		},
		useTable: {
			operation: '操作',
			total: (total: number) => formatString('共 {} 条', total),
			columnSettings: '列设置',
			showColumn: '显示列',
			hideColumn: '隐藏列',
			resetColumns: '重置列设置',
			allColumns: '全部列',
		},
	}),
	zhTW: createTranslation({
		useModal: {
			cannotClose: '當前狀態無法關閉彈窗',
			cancel: '取消',
			confirm: '確認',
		},
		useBatch: {
			batchOperation: '批量操作',
			selectedItems: (count: number) => formatString('已選擇 {} 項', count),
			startBatch: '開始批量操作',
			placeholder: '請選擇操作',
		},
		useForm: {
			submit: '提交',
			reset: '重置',
			expand: '展開',
			collapse: '收起',
			moreConfig: '更多配置',
			help: '幫助文檔',
			required: '必填項',
			placeholder: (label: string) => formatString('請輸入{}', label),
		},
		useFullScreen: {
			exit: '退出全屏',
			enter: '進入全屏',
		},
		useTable: {
			operation: '操作',
			total: (total: number) => formatString('共 {} 條', total),
		},
	}),
	enUS: createTranslation({
		useModal: {
			cannotClose: 'Cannot close the dialog in current state',
			cancel: 'Cancel',
			confirm: 'Confirm',
		},
		useBatch: {
			batchOperation: 'Batch Operation',
			selectedItems: (count: number) => formatString('{} items selected', count),
			startBatch: 'Start Batch Operation',
			placeholder: 'Select operation',
		},
		useForm: {
			submit: 'Submit',
			reset: 'Reset',
			expand: 'Expand',
			collapse: 'Collapse',
			moreConfig: 'More Configuration',
			help: 'Help Documentation',
			required: 'Required',
			placeholder: (label: string) => formatString('Please enter {}', label),
		},
		useFullScreen: {
			exit: 'Exit Fullscreen',
			enter: 'Enter Fullscreen',
		},
		useTable: {
			operation: 'Operation',
			total: (total: number) => formatString('Total {} items', total),
			columnSettings: 'Column Settings',
			showColumn: 'Show Column',
			hideColumn: 'Hide Column',
			resetColumns: 'Reset Columns',
			allColumns: 'All Columns',
		},
	}),
	jaJP: createTranslation({
		useModal: {
			cannotClose: '現在の状態ではダイアログを閉じることができません',
			cancel: 'キャンセル',
			confirm: '確認',
		},
		useBatch: {
			batchOperation: 'バッチ操作',
			selectedItems: (count: number) => formatString('{}項目が選択されました', count),
			startBatch: 'バッチ操作を開始',
			placeholder: '操作を選択',
		},
		useForm: {
			submit: '提出する',
			reset: 'リセット',
			expand: '展開',
			collapse: '折りたたみ',
			moreConfig: '詳細設定',
			help: 'ヘルプドキュメント',
			required: '必須',
			placeholder: (label: string) => formatString('{}を入力してください', label),
		},
		useFullScreen: {
			exit: '全画面表示を終了',
			enter: '全画面表示に入る',
		},
		useTable: {
			operation: '操作',
			total: (total: number) => formatString('合計 {} 件', total),
		},
	}),
	ruRU: createTranslation({
		useModal: {
			cannotClose: 'Невозможно закрыть диалог в текущем состоянии',
			cancel: 'Отмена',
			confirm: 'Подтвердить',
		},
		useBatch: {
			batchOperation: 'Пакетная операция',
			selectedItems: (count: number) => formatString('Выбрано {} элементов', count),
			startBatch: 'Начать пакетную операцию',
			placeholder: 'Выберите операцию',
		},
		useForm: {
			submit: 'Отправить',
			reset: 'Сбросить',
			expand: 'Развернуть',
			collapse: 'Свернуть',
			moreConfig: 'Дополнительная конфигурация',
			help: 'Документация',
			required: 'Обязательно',
			placeholder: (label: string) => formatString('Пожалуйста, введите {}', label),
		},
		useFullScreen: {
			exit: 'Выйти из полноэкранного режима',
			enter: 'Войти в полноэкранный режим',
		},
		useTable: {
			operation: 'Операция',
			total: (total: number) => formatString('Всего {} элементов', total),
		},
	}),
	koKR: createTranslation({
		useModal: {
			cannotClose: '현재 상태에서는 대화 상자를 닫을 수 없습니다',
			cancel: '취소',
			confirm: '확인',
		},
		useBatch: {
			batchOperation: '일괄 작업',
			selectedItems: (count: number) => formatString('{}개 항목 선택됨', count),
			startBatch: '일괄 작업 시작',
			placeholder: '작업 선택',
		},
		useForm: {
			submit: '제출',
			reset: '재설정',
			expand: '확장',
			collapse: '축소',
			moreConfig: '추가 구성',
			help: '도움말',
			required: '필수 항목',
			placeholder: (label: string) => formatString('{} 입력하세요', label),
		},
		useFullScreen: {
			exit: '전체 화면 종료',
			enter: '전체 화면 시작',
		},
		useTable: {
			operation: '작업',
			total: (total: number) => formatString('총  {} 페이지', total),
		},
	}),
	ptBR: createTranslation({
		useModal: {
			cannotClose: 'Não é possível fechar o diálogo no estado atual',
			cancel: 'Cancelar',
			confirm: 'Confirmar',
		},
		useBatch: {
			batchOperation: 'Operação em Lote',
			selectedItems: (count: number) => formatString('{} itens selecionados', count),
			startBatch: 'Iniciar Operação em Lote',
			placeholder: 'Selecione a operação',
		},
		useForm: {
			submit: 'Enviar',
			reset: 'Redefinir',
			expand: 'Expandir',
			collapse: 'Recolher',
			moreConfig: 'Mais Configurações',
			help: 'Documentação de Ajuda',
			required: 'Obrigatório',
			placeholder: (label: string) => formatString('Por favor, insira {}', label),
		},
		useFullScreen: {
			exit: 'Sair da Tela Cheia',
			enter: 'Entrar em Tela Cheia',
		},
		useTable: {
			operation: 'Operação',
			total: (total: number) => formatString('Total {} páginas', total),
		},
	}),
	frFR: createTranslation({
		useModal: {
			cannotClose: "Impossible de fermer la boîte de dialogue dans l'état actuel",
			cancel: 'Annuler',
			confirm: 'Confirmer',
		},
		useBatch: {
			batchOperation: 'Opération par lot',
			selectedItems: (count: number) => formatString('{} éléments sélectionnés', count),
			startBatch: 'Démarrer une opération par lot',
			placeholder: 'Sélectionnez une opération',
		},
		useForm: {
			submit: 'Soumettre',
			reset: 'Réinitialiser',
			expand: 'Développer',
			collapse: 'Réduire',
			moreConfig: 'Plus de configuration',
			help: "Documentation d'aide",
			required: 'Obligatoire',
			placeholder: (label: string) => formatString('Veuillez entrer {}', label),
		},
		useFullScreen: {
			exit: 'Quitter le mode plein écran',
			enter: 'Passer en mode plein écran',
		},
		useTable: {
			operation: 'Opération',
			total: (total: number) => formatString('Total {} pages', total),
		},
	}),
	esAR: createTranslation({
		useModal: {
			cannotClose: 'No se puede cerrar el diálogo en el estado actual',
			cancel: 'Cancelar',
			confirm: 'Confirmar',
		},
		useBatch: {
			batchOperation: 'Operación por lotes',
			selectedItems: (count: number) => formatString('{} elementos seleccionados', count),
			startBatch: 'Iniciar operación por lotes',
			placeholder: 'Seleccionar operación',
		},
		useForm: {
			submit: 'Enviar',
			reset: 'Restablecer',
			expand: 'Expandir',
			collapse: 'Colapsar',
			moreConfig: 'Más configuración',
			help: 'Documentación de ayuda',
			required: 'Obligatorio',
			placeholder: (label: string) => formatString('Por favor ingrese {}', label),
		},
		useFullScreen: {
			exit: 'Salir de pantalla completa',
			enter: 'Entrar en pantalla completa',
		},
		useTable: {
			operation: 'Operación',
			total: (total: number) => formatString('Total {} páginas', total),
		},
	}),
	arDZ: createTranslation({
		useModal: {
			cannotClose: 'لا يمكن إغلاق مربع الحوار في الحالة الحالية',
			cancel: 'إلغاء',
			confirm: 'تأكيد',
		},
		useBatch: {
			batchOperation: 'عملية دفعية',
			selectedItems: (count: number) => formatString('تم تحديد {} عنصر', count),
			startBatch: 'بدء عملية دفعية',
			placeholder: 'اختر العملية',
		},
		useForm: {
			submit: 'إرسال',
			reset: 'إعادة تعيين',
			expand: 'توسيع',
			collapse: 'طي',
			moreConfig: 'مزيد من الإعدادات',
			help: 'وثائق المساعدة',
			required: 'إلزامي',
			placeholder: (label: string) => formatString('الرجاء إدخال {}', label),
		},
		useFullScreen: {
			exit: 'الخروج من وضع ملء الشاشة',
			enter: 'الدخول إلى وضع ملء الشاشة',
		},
		useTable: {
			operation: 'العملية',
			total: (total: number) => formatString('إجمالي {} صفحات', total),
		},
	}),
}

// 类型导出
export type TranslationType = typeof translation
export type TranslationLocale = keyof TranslationType
export type TranslationModule = TranslationType[TranslationLocale]
export type TranslationModuleValue = keyof TranslationType[TranslationLocale][TranslationModule]

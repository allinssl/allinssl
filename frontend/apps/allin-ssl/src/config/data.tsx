import { $t } from '@locales/index'

// 消息推送类型
export interface MessagePushType {
  name: string
  type: string
}

// 定义ApiProject接口，包含可选的notApi属性
export interface ApiProjectType {
  name: string
  icon: string
  type?: string[]
  notApi?: boolean
  hostRelated?: Record<string, any>
  sort?: number
}

// $t('t_0_1747886301644')
export const MessagePushConfig = {
  mail: { name: $t('t_68_1745289354676'), type: 'mail' },
  workwx: { name: $t('t_33_1746773350932'), type: 'workwx' },
  dingtalk: { name: $t('t_32_1746773348993'), type: 'dingtalk' },
  feishu: { name: $t('t_34_1746773350153'), type: 'feishu' },
  webhook: { name: 'WebHook', type: 'webhook' },
}

// CA证书授权
export const CACertificateAuthorization = {
  zerossl: { name: 'ZeroSSL', type: 'zerossl' },
  google: { name: 'Google', type: 'google' },
  sslcom: { name: 'SSL.COM', type: 'sslcom' },
  buypass: { name: 'Buypass', type: 'buypass' },
  letsencrypt: { name: "Let's Encrypt", type: 'letsencrypt' },
  custom: { name: '自定义', type: 'custom' },
}

// 授权API管理
// 结构说明：{name: '名称', icon: '图标', type: ['类型'], notApi: 是否需要API，默认需要, hostRelated: { default: { name: '默认' } }, sort: 排序}
export const ApiProjectConfig: Record<string, ApiProjectType> = {
  localhost: {
    name: $t("t_4_1744958838951"),
    icon: "ssh",
    type: ["host"],
    notApi: false,
    hostRelated: { default: { name: $t("t_4_1744958838951") } },
    sort: 1,
  },
  ssh: {
    name: "SSH",
    icon: "ssh",
    type: ["host"],
    hostRelated: { default: { name: "SSH" } },
    sort: 2,
  },
  btpanel: {
    name: $t("t_10_1745735765165"),
    icon: "btpanel",
    hostRelated: {
      default: { name: $t("t_10_1745735765165") },
      site: { name: $t("t_1_1747886307276") },
      dockersite: { name: $t("t_0_1747994891459") },
      singlesite: { name: $t("t_1_1747886307276") + "\r\n（Win/Linux 9.4前）" },
    },
    type: ["host"],
    sort: 3,
  },
  btwaf: {
    name: $t("t_3_1747886302848"),
    icon: "btwaf",
    hostRelated: { site: { name: $t("t_4_1747886303229") } },
    type: ["host"],
    sort: 4,
  },
  "1panel": {
    name: "1Panel",
    icon: "1panel",
    hostRelated: {
      default: { name: "1Panel" },
      site: { name: $t("t_2_1747886302053") },
    },
    type: ["host"],
    sort: 5,
  },
  aliyun: {
    name: $t("t_2_1747019616224"),
    icon: "aliyun",
    type: ["host", "dns"],
    hostRelated: {
      cdn: { name: $t("t_16_1745735766712") },
      dcdn: { name: $t("t_0_1752230148946") },
      oss: { name: $t("t_2_1746697487164") },
      waf: { name: $t("t_10_1744958860078") },
      esa: { name: $t("t_1_1752230146379") },
    },
    sort: 6,
  },
  tencentcloud: {
    name: $t("t_3_1747019616129"),
    icon: "tencentcloud",
    type: ["host", "dns"],
    hostRelated: {
      cdn: { name: $t("t_14_1745735766121") },
      cos: { name: $t("t_15_1745735768976") },
      waf: { name: $t("t_9_1744958840634") },
      teo: { name: $t("t_5_1747886301427") },
    },
    sort: 7,
  },
  huaweicloud: {
    name: $t("t_9_1747886301128"),
    icon: "huaweicloud",
    type: ["host", "dns"],
    hostRelated: {
      cdn: { name: $t("t_9_1747886301128") + "CDN" },
    },
    sort: 10,
  },
  baidu: {
    name: $t("t_10_1747886300958"),
    icon: "baidu",
    type: ["host", "dns"],
    hostRelated: {
      cdn: { name: "百度云CDN" },
    },
    sort: 11,
  },
  volcengine: {
    name: $t("t_13_1747886301689"),
    icon: "volcengine",
    type: ["host", "dns"],
    hostRelated: {
      cdn: { name: $t("t_13_1747886301689") + "CDN" },
      dcdn: { name: $t("t_13_1747886301689") + "DCDN" },
    },
    sort: 13,
  },
  safeline: {
    name: $t("t_11_1747886301986"),
    icon: "safeline",
    type: ["host"],
    hostRelated: {
      panel: { name: $t("t_1_1747298114192") },
      site: { name: $t("t_12_1747886302725") },
    },
    sort: 8,
  },
  qiniu: {
    name: $t("t_6_1747886301844"),
    icon: "qiniu",
    type: ["host"],
    hostRelated: {
      cdn: { name: $t("t_7_1747886302395") },
      oss: { name: $t("t_8_1747886304014") },
    },
    sort: 9,
  },

  cloudflare: {
    name: "Cloudflare",
    icon: "cloudflare",
    type: ["dns"],
    sort: 12,
  },

  westcn: {
    name: $t("t_14_1747886301884"),
    icon: "westcn",
    type: ["dns"],
    sort: 14,
  },
  godaddy: {
    name: "GoDaddy",
    icon: "godaddy",
    type: ["dns"],
    sort: 15,
  },
  namecheap: {
    name: "Namecheap",
    icon: "namecheap",
    type: ["dns"],
    sort: 16,
  },
  ns1: {
    name: "NS1",
    icon: "ns1",
    type: ["dns"],
    sort: 17,
  },
  cloudns: {
    name: "ClouDNS",
    icon: "cloudns",
    type: ["dns"],
    sort: 18,
  },
  aws: {
    name: "AWS",
    icon: "aws",
    type: ["dns"],
    sort: 19,
  },
  azure: {
    name: "Azure",
    icon: "azure",
    type: ["dns"],
    sort: 20,
  },
  namesilo: {
    name: "Namesilo",
    icon: "namesilo",
    type: ["dns"],
    sort: 21,
  },
  namedotcom: {
    name: "Name.com",
    icon: "namedotcom",
    type: ["dns"],
    sort: 22,
  },
  bunny: {
    name: "Bunny",
    icon: "bunny",
    type: ["dns"],
    sort: 23,
  },
  gcore: {
    name: "Gcore",
    icon: "gcore",
    type: ["dns"],
    sort: 24,
  },
  jdcloud: {
    name: "京东云",
    icon: "jdcloud",
    type: ["dns"],
    sort: 25,
  },
  lecdn: {
    name: "LeCDN",
    icon: "lecdn",
    type: ["dns", "host"],
    hostRelated: { default: { name: "LeCDN" } },
    sort: 26,
  },
  constellix: {
    name: "Constellix",
    icon: "constellix",
    type: ["dns"],
    sort: 27,
  },
  doge: {
    name: $t("t_0_1750129254226"),
    icon: "doge",
    type: ["host"],
    hostRelated: {
      cdn: { name: $t("t_0_1750129254226") + "CDN" },
    },
    sort: 28,
  },
  webhook: {
    name: "Webhook",
    icon: "webhook",
    type: ["host", "dns"],
    hostRelated: { default: { name: "Webhook" } },
    sort: 31,
  },
  spaceship: {
    name: "Spaceship",
    icon: "spaceship",
    type: ["dns"],
    hostRelated: { default: { name: "Spaceship" } },
    sort: 32,
  },
  btdomain: {
    name: "宝塔域名",
    icon: "btdomain",
    type: ["dns"],
    hostRelated: { default: { name: "BTDomain" } },
    sort: 33,
  },
  rainyun: {
    name: "雨云",
    icon: "rainyun",
    type: ["dns"],
    hostRelated: {
      sslcenter: { name: "证书中心" }
    },
    sort: 33,
  },
  plugin: {
    name: "插件",
    icon: "plugin",
    type: ["host"],
    hostRelated: { default: { name: "插件" } },
    sort: 29,
  },
};

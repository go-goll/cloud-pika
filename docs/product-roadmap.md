# Cloud Pika 产品规划文档

> 版本：v2.0 | 更新日期：2026-04-11 | 文档性质：产品功能规划与技术可行性分析

---

## 一、产品愿景

Cloud Pika 的目标不是做一个"能传文件的工具"，而是成为开发者和运维工程师的**云存储操作台**——一个将分散在各家云厂商控制台中的存储、CDN、数据处理能力聚合到桌面端的统一工作平台。

核心差异化价值：**多云统一管理 × CDN 深度集成 × 桌面原生体验 × 开源免费**。

### 1.1 目标用户画像

| 角色 | 场景 | 核心诉求 |
|------|------|---------|
| 前端/全栈开发者 | 日常开发中上传静态资源、图片到 CDN | 快速上传 → 拿到 URL → 刷新 CDN，三步合一 |
| DevOps / SRE | 管理多个项目的多个 Bucket，跨云厂商 | 统一界面切换账号，批量操作，CORS/生命周期配置 |
| 内容运营 | 上传文章配图、视频素材到对象存储 | 拖拽上传、图片预览、缩略图生成 |
| 独立开发者 | 个人项目使用 MinIO 或小厂商存储 | S3 兼容即可使用，零门槛接入 |

### 1.2 当前版本现状

项目基于 Tauri 2 + React 18 + Go Sidecar 架构，已支持 9 家云厂商的基础文件操作。但"基础文件操作"距离"好用的产品"还有显著差距：除七牛云外，其余厂商仅走 S3 兼容层的 CRUD；CDN 管理、存储配置、数据处理等高价值能力完全空白；前端交互尚未达到桌面应用的基本体验标准。

---

## 二、功能架构总览

将产品能力分为五个层次，从基础到增值逐层构建：

```
┌─────────────────────────────────────────────────────────┐
│  第五层：智能处理 — 图片处理、音视频转码、AI 能力        │
├─────────────────────────────────────────────────────────┤
│  第四层：可观测性 — 用量统计、带宽监控、请求分析          │
├─────────────────────────────────────────────────────────┤
│  第三层：存储治理 — 生命周期、CORS、防盗链、版本管理      │
├─────────────────────────────────────────────────────────┤
│  第二层：CDN 管理 — 缓存刷新、预热、域名管理、用量统计    │
├─────────────────────────────────────────────────────────┤
│  第一层：文件操作 — 上传/下载/删除/重命名/搜索/预览       │
└─────────────────────────────────────────────────────────┘
```

---

## 三、第二层：CDN 管理

CDN 管理是本次规划的核心增值模块。开发者上传资源后最常见的下一步就是刷新 CDN 缓存，但目前需要在文件管理工具和云厂商控制台之间反复切换。将 CDN 操作嵌入文件管理流程，是 Cloud Pika 区别于 Cyberduck、S3 Browser 等竞品的关键差异点。

### 3.1 CDN 缓存刷新

**产品目标**：选中文件 → 右键「刷新 CDN 缓存」→ 完成。将三步操作缩减为一步。

**各厂商 Open API 调研**：

#### 七牛云（当前已实现）
- **API**: `POST https://api.qiniu.com/v2/tune/refresh`
- **鉴权**: `Authorization: Qiniu <AccessToken>`（HMAC-SHA1 签名）
- **请求体**: `{"urls": ["..."], "dirs": ["..."]}`，目录刷新 URL 须以 `/` 结尾
- **限制**: URL 和目录刷新合计 240 次/秒
- **返回**: `TaskId` 用于追踪刷新状态
- **Go SDK**: `github.com/qiniu/go-sdk/v7` — CdnManager.RefreshUrls / RefreshDirs

#### 阿里云 CDN
- **API**: `Action=RefreshObjectCaches`，RPC 协议
- **Endpoint**: `cdn.aliyuncs.com`
- **参数**: `ObjectPath`（URL 或目录数组），`ObjectType`（File/Directory），`Force`（强制刷新）
- **限制**: 50 次/秒/账号；每日 URL 上限 10000 条、目录 100 条；单次最多 1000 条 URL 或 100 条目录
- **配额查询**: `Action=DescribeRefreshQuota`（20 次/秒），返回当日剩余配额
- **Go SDK**: `github.com/aliyun/alibaba-cloud-sdk-go/services/cdn` — `client.RefreshObjectCaches(request)`
- **注意**: CDN API 与 OSS API 使用不同 SDK 和端点，但可复用相同 AccessKey/SecretKey

#### 腾讯云 CDN
- **API**: `Action=PurgeUrlsCache`（URL 刷新）/ `PurgePathCache`（目录刷新）
- **Endpoint**: `cdn.tencentcloudapi.com`
- **限制**: URL 每日 10000 条、单次 1000 条；目录每日 100 条、单次 20 条；20 次/秒
- **任务查询**: `Action=DescribePurgeTasks` 可查刷新状态（JobId / Status / CreateTime）
- **Go SDK**: `github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cdn/v20180606` — `client.PurgeUrlsCache()` / `client.PurgePathCache()`
- **注意**: CDN SDK 独立于 COS SDK，需单独引入

#### 又拍云
- **API**: `POST https://purge.upyun.com/purge/`
- **鉴权**: `Authorization: UpYun <bucket>:<operator>:<signature>`，签名为 `Base64(MD5(urls + "\n" + bucket + "&" + date + "&" + password_md5))`
- **请求体**: Form 表单字段 `purge`，换行分隔 URL
- **生效时间**: 自定义源 CDN 5-10 分钟，又拍云对象存储最长 1 小时
- **当前状态**: 代码中返回 `"upyun cdn refresh is not implemented yet"`，须修复
- **Go SDK**: `github.com/upyun/go-sdk` — 需自行封装 HTTP 调用，SDK 未直接暴露 Purge 方法

#### AWS CloudFront
- **API**: `CreateInvalidation`
- **参数**: `DistributionId`（必须）、`InvalidationBatch.Paths`（路径数组，支持通配符如 `/images/*`）、`CallerReference`（幂等标识）
- **限制**: 每月前 1000 条路径免费，超出 $0.005/条；单次无硬性条数限制
- **状态查询**: `GetInvalidation` 返回 `Status: InProgress | Completed`
- **Go SDK**: `github.com/aws/aws-sdk-go-v2/service/cloudfront` — `client.CreateInvalidation()`
- **特殊性**: CloudFront 与 S3 是独立服务，需要用户额外提供 Distribution ID。建议在账号配置中增加可选的 `cloudfront_distribution_id` 字段，并提供 `client.ListDistributions()` 让用户从下拉列表中选择

#### MinIO
- 不适用。MinIO 是自建存储，不包含 CDN 层。

**产品设计要点**：
1. 右键菜单「刷新 CDN 缓存」— 根据当前选中文件 + Bucket 绑定域名拼接完整 URL
2. 批量刷新 — 多选文件后一键刷新
3. 上传后自动刷新 — 设置项「上传完成后自动刷新同名 CDN 缓存」
4. 配额提示 — 对有每日配额的厂商（阿里云、腾讯云），在操作前调用配额查询 API 展示剩余次数
5. 状态追踪 — 腾讯云/AWS 支持任务状态查询，可在传输列表中展示刷新进度

---

### 3.2 CDN 预热（Prefetch）

**产品目标**：新资源发布前，主动推送到 CDN 边缘节点，消除首次访问延迟。

**各厂商 Open API 调研**：

| 厂商 | API | 限制 | Go SDK |
|------|-----|------|--------|
| 七牛云 | `POST iovip-<region>.qiniuio.com/prefetch/<EncodedEntryURI>` | 与刷新共享 240次/秒 | `go-sdk/v7` CdnManager.PrefetchUrls |
| 阿里云 | `Action=PushObjectCache` @ `cdn.aliyuncs.com` | 50次/秒，每日 1000 条，队列上限 100000 | `alibaba-cloud-sdk-go/services/cdn` client.PushObjectCache() |
| 腾讯云 | `Action=PushUrlsCache` @ `cdn.tencentcloudapi.com` | 20次/秒，每日 10000 条 | `tencentcloud-sdk-go cdn/v20180606` client.PushUrlsCache() |
| 又拍云 | 控制台操作为主，API 支持有限 | 非高峰期执行 | 需自行 HTTP 调用 |
| AWS | 无原生预热 API | — | 可通过脚本发起 GET 请求间接预热 |

**产品设计要点**：
1. 文件右键菜单「预热到 CDN」
2. 对不支持预热的厂商（AWS）隐藏此选项或提供替代方案说明
3. 展示每日预热配额和已用量

---

### 3.3 CDN 加速域名管理

**产品目标**：在 Bucket 详情页直接查看绑定的加速域名，一键切换生成外链时使用的域名。

**各厂商 Open API 调研**：

| 厂商 | 域名列表 API | Go SDK 方法 |
|------|-------------|------------|
| 七牛云 | Kodo 域名管理 API（已实现） | `go-sdk/v7` BucketManager 相关方法 |
| 阿里云 | `Action=DescribeUserDomains` @ `cdn.aliyuncs.com`，支持分页和域名筛选 | `alibaba-cloud-sdk-go/services/cdn` client.DescribeUserDomains() |
| 腾讯云 | `Action=DescribeDomains` @ `cdn.tencentcloudapi.com`，返回项目ID/服务状态/域名配置详情 | `tencentcloud-sdk-go cdn/v20180606` client.DescribeDomains() |
| 又拍云 | 域名管理 REST API，每个服务最多 10 个自定义域名 | `go-sdk` 未直接暴露，需 HTTP 调用 |
| AWS | `ListDistributions` 列出所有 CloudFront 分发，需从 Origins 中匹配 S3 Bucket | `aws-sdk-go-v2/service/cloudfront` client.ListDistributions() |

**产品设计要点**：
1. Bucket 详情页增加「域名」标签页
2. 列表展示：域名、状态（已启用/配置中/已停用）、HTTPS 状态
3. 操作：复制域名、设为默认域名（生成外链时优先使用）
4. AWS 场景：自动扫描 CloudFront 分发中 Origin 匹配当前 Bucket 的记录，减少用户手动配置

---

### 3.4 CDN 带宽与流量统计

**产品目标**：在应用内查看域名的带宽、流量、请求量趋势。

**各厂商 Open API 调研**：

| 厂商 | 带宽 API | 流量 API | 粒度 |
|------|---------|---------|------|
| 七牛云 | `GET /v2/tune/monitoring/bandwidth` | `GET /v2/tune/monitoring/traffic` | 5 分钟，按域名+国内/海外分维度 |
| 阿里云 | `DescribeDomainBpsData` | `DescribeDomainTrafficData` | 300s / 3600s / 86400s 可选 |
| 腾讯云 | `DescribeCdnData` metric=bandwidth | `DescribeCdnData` metric=flux | 20次/秒，支持按域名/区域筛选 |
| 又拍云 | 带宽监控 API | 流量统计 API | 实时+历史 |
| AWS | CloudWatch `GetMetricData` | 同左 | 1 分钟（需启用请求指标） |

**产品设计要点**：
1. 新增「统计」页面，使用 Recharts 绘制折线图
2. 支持时间范围选择器：今日 / 7 天 / 30 天 / 自定义
3. 按域名维度筛选
4. 这是 P2 功能，可在 CDN 核心操作稳定后再实现

---

## 四、第三层：存储治理

存储治理功能面向 DevOps 和高级用户，帮助他们在桌面端完成原本需要登录控制台才能做的 Bucket 配置操作。

### 4.1 生命周期规则管理

**产品目标**：可视化配置对象过期删除和存储类型转换规则，优化存储成本。

**各厂商 Open API 调研**：

#### 七牛云 Kodo
- **API**: 生命周期规则 CRUD
- **规则参数**: `name`（<50字符）、`prefix`（文件前缀）、`delete_after_days`（过期天数，0=不删除）、`to_line_after_days`（转低频存储天数）
- **Go SDK**: `go-sdk/v7/storage` — `BucketManager.GetBucketLifeCycleRule(bucket)` / `AddBucketLifeCycleRule()`
- **存储类型**: 标准 → 低频

#### 阿里云 OSS
- **API**: `PUT /?lifecycle` @ `BucketName.oss-<Region>.aliyuncs.com`
- **请求体**: XML 格式 `<LifecycleConfiguration>`，包含 `<Rule>` 元素（ID / Status / Prefix / Expiration / Transition）
- **权限**: `oss:PutBucketLifecycle`
- **Go SDK V2**: `alibabacloud-oss-go-sdk-v2` — `client.PutBucketLifecycle()` / `client.GetBucketLifecycle()`
- **存储类型**: 标准 → 低频 → 归档 → 深度归档（4 级）

#### 腾讯云 COS
- **API**: `PUT /?lifecycle` @ `<BucketName-APPID>.cos.<Region>.myqcloud.com`
- **请求体**: XML 格式，Rule 元素含 Filter / Expiration / Transition / NoncurrentVersionExpiration / AbortIncompleteMultipartUpload
- **权限**: `cos:PutBucketLifecycle`
- **Go SDK**: `cos-go-sdk-v5` — `client.Bucket.PutLifecycle()` / `GetLifecycle()`
- **存储类型**: 标准 → 低频 → 智能分层 → 归档 → 深度归档（5 级）

#### AWS S3
- **API**: `PutBucketLifecycleConfiguration`
- **限制**: 每 Bucket 最多 1000 条规则
- **支持**: Transition（存储类型迁移）+ Expiration（过期删除）+ NoncurrentVersionTransition + AbortIncompleteMultipartUpload
- **Go SDK V2**: `aws-sdk-go-v2/service/s3` — `client.PutBucketLifecycleConfiguration()`
- **存储类型**: Standard → Standard-IA → Intelligent-Tiering → Glacier → Glacier Deep Archive

#### MinIO
- **API**: S3 兼容生命周期 API
- **特色**: 支持 ILM Transition 将旧数据迁移到外部存储（其他 MinIO 集群或公有云）
- **Go SDK**: `minio-go/v7` — `client.SetBucketLifecycle()` / `GetBucketLifecycle()`

#### 又拍云
- **不支持** 生命周期规则 API

**产品设计**：
1. Bucket 设置面板 →「生命周期规则」区域
2. 规则列表展示：前缀 / 操作类型 / 天数 / 状态
3. 新建规则表单：前缀过滤器 → 选择操作（删除/转储类型）→ 设置天数
4. 提供常用模板："30天后删除临时文件"、"90天转归档存储"
5. 不支持的厂商通过 Feature Flag 隐藏此区域

**优先级**：P2

---

### 4.2 CORS 跨域配置

**产品目标**：为需要浏览器直传的 Bucket 快速配置 CORS 规则。

**各厂商 Open API 调研**：

| 厂商 | API | 最大规则数 | Go SDK |
|------|-----|-----------|--------|
| 七牛云 | Kodo CORS API | 支持 | `go-sdk/v7` |
| 阿里云 | `PUT /?cors` XML 格式，含 AllowedOrigin / AllowedMethod / AllowedHeader / ExposeHeader / MaxAgeSeconds | 无硬限制（总量控制） | `alibabacloud-oss-go-sdk-v2` client.PutBucketCors() |
| 腾讯云 | `PUT /?cors` XML 格式，参数同阿里云 | Header 总量 64KB | `cos-go-sdk-v5` client.Bucket.PutBucketCors() |
| AWS | `PutBucketCors` XML 格式 | 100 条 | `aws-sdk-go-v2/service/s3` client.PutBucketCors() |
| MinIO | S3 兼容 CORS API | 同 AWS | `minio-go/v7`（通过 S3 API） |
| 又拍云 | 控制台配置 | — | 不支持 API 操作 |

**产品设计**：
1. Bucket 设置面板 →「跨域配置」
2. 规则列表 + 新建规则表单
3. 预设模板：「允许所有来源（开发环境）」「仅允许指定域名（生产环境）」
4. 快捷操作：一键允许 `*` 源 + GET/PUT/POST 方法

**优先级**：P2

---

### 4.3 防盗链（Referer）配置

**产品目标**：保护存储资源不被外站盗链，配置 Referer 白名单或黑名单。

**各厂商 Open API 调研**：

| 厂商 | API | 配置方式 | Go SDK |
|------|-----|---------|--------|
| 阿里云 | `PUT /?referer`，XML 格式含 AllowEmptyReferer / RefererList / RefererBlacklist，支持 `*` 和 `?` 通配符，总量 ≤20KB | 白名单 + 黑名单 | `alibabacloud-oss-go-sdk-v2` client.PutBucketReferer() |
| 腾讯云 | `PUT /?referer`，XML 含 Status / RefererType (White-List/Black-List) / DomainList / EmptyReferConfiguration | 白名单或黑名单 | `cos-go-sdk-v5` |
| AWS | 通过 Bucket Policy 实现 `aws:Referer` 条件键 | Policy JSON | `aws-sdk-go-v2/service/s3` client.PutBucketPolicy() |
| 七牛云 | CDN 域名配置中的 Referer 防盗链 | CDN 层面 | `go-sdk/v7` CDN 域名配置 |
| 又拍云 | CDN 配置项 | CDN 层面 | — |

**产品设计**：
1. Bucket 设置面板 →「防盗链」
2. 开关：启用/禁用
3. 模式选择：白名单 / 黑名单
4. 域名列表编辑器，支持通配符
5. 选项：是否允许空 Referer

**优先级**：P2

---

### 4.4 版本管理

**产品目标**：启用版本控制后，查看文件的历史版本，支持下载旧版本和版本回滚。

**各厂商 Open API 调研**：

| 厂商 | 启用/查看状态 | 列出版本 | 特殊说明 |
|------|-------------|---------|---------|
| 阿里云 | `PUT/GET /?versioning` Status: Enabled/Suspended | `GET /?versions` prefix/key-marker/version-id-marker 分页，max-keys 默认100最大1000 | 权限 `oss:PutBucketVersioning` / `oss:ListBucketVersions` |
| 腾讯云 | `PUT/GET /?versioning` | `GET /?versions` 参数同阿里云 | 权限 `cos:PutBucketVersioning` / `cos:ListBucket` |
| AWS | `PutBucketVersioning` Status: Enabled/Suspended，支持 MFADelete | `ListObjectVersions` max-keys 最大 1000，返回含 DeleteMarkers | 一旦启用不可关闭只能暂停 |
| MinIO | `EnableVersioning` / `GetBucketVersioning` | S3 兼容 ListObjectVersions | 需 Erasure Coding 分布式部署 |
| 七牛云 | **不支持** | — | — |
| 又拍云 | **不支持** | — | — |

**Go SDK 方法对照**：

| 厂商 | 包 | 启用 | 查询 | 版本列表 |
|------|---|------|------|---------|
| 阿里云 | `alibabacloud-oss-go-sdk-v2` | PutBucketVersioning() | GetBucketVersioning() | ListObjectVersions (REST) |
| 腾讯云 | `cos-go-sdk-v5` | PutBucketVersioning() | GetBucketVersioning() | 通过 REST `?versions` |
| AWS | `aws-sdk-go-v2/service/s3` | PutBucketVersioning() | GetBucketVersioning() | ListObjectVersions() + Paginator |
| MinIO | `minio-go/v7` | EnableVersioning() | GetBucketVersioning() | S3 兼容 |

**产品设计**：
1. Bucket 设置中展示版本控制状态，支持启用/暂停
2. 文件详情面板 →「版本历史」列表
3. 每个版本显示：版本 ID、修改时间、文件大小
4. 操作：下载指定版本、回滚（删除当前版本使旧版成为最新）

**优先级**：P3

---

### 4.5 服务端加密配置

**产品目标**：为 Bucket 配置默认加密策略。

**各厂商 Open API 调研**：

| 厂商 | API | 加密算法 | Go SDK |
|------|-----|---------|--------|
| 阿里云 | `PUT /?encryption` XML 含 SSEAlgorithm (AES256/KMS) + KMSMasterKeyID | SSE-OSS (AES256) / SSE-KMS | `alibabacloud-oss-go-sdk-v2` client.PutBucketEncryption() |
| 腾讯云 | `PUT /?encryption` XML 含 SSEAlgorithm (AES256/cos/kms) | AES256 / KMS / SM4（国密） | `cos-go-sdk-v5` |
| AWS | `PutBucketEncryption` 每 Bucket 1 条默认规则 | AES256 / aws:kms | `aws-sdk-go-v2/service/s3` client.PutBucketEncryption() |
| MinIO | `SetBucketEncryption` | SSE-S3 / SSE-KMS / SSE-C | `minio-go/v7` client.SetBucketEncryption() |

**产品设计**：
1. Bucket 设置 →「加密」区域
2. 展示当前加密状态
3. 简洁的开关 + 算法选择下拉框

**优先级**：P3

---

## 五、第五层：智能处理

### 5.1 图片处理

**产品目标**：在预览图片时，直接生成带处理参数的 URL（缩略图、格式转换、水印），省去手动拼接 URL 参数的繁琐过程。

**各厂商图片处理 API 调研**：

#### 七牛云
- **imageView2**：`<url>?imageView2/<mode>/w/<Width>/h/<Height>/format/<Format>/q/<Quality>`
  - mode 0-5：限定长边、居中裁剪、限定短边等
- **imageMogr2**：`<url>?imageMogr2/auto-orient/thumbnail/<geometry>/crop/<WxH>/rotate/<angle>/blur/<radius>x<sigma>/format/<fmt>/quality/<q>`
  - 支持：自动旋转、缩放、裁剪、旋转、高斯模糊、格式转换、质量调节
- **水印**：`<url>?watermark/1/image/<EncodedURL>` 或 `watermark/2/text/<EncodedText>/font/<Font>/fontsize/<Size>`

#### 阿里云 OSS
- **URL 格式**：`<url>?x-oss-process=image/<operation1>,<param1>/<operation2>,<param2>`
- **操作集**：
  - `resize,w_300,h_200,m_lfit` — 缩放（模式：lfit/fill/pad/fixed）
  - `quality,q_80` / `quality,Q_90` — 相对/绝对质量
  - `format,webp` — 格式转换
  - `watermark,type_d5b_,text_<Base64>,size_30` — 文字水印（Base64 编码，最长 64 英文字符）
  - `crop,w_300,h_200,x_10,y_10` — 裁剪
  - `rotate,90` — 旋转

#### 腾讯云 数据万象 CI
- **URL 格式**：`<url>?imageMogr2/<operation>/<param>`
- **操作集**：缩放 / 裁剪 / 旋转 / 格式转换 / 质量调节 / 水印
- **特色能力**：Guetzli 压缩、AVIF 转码、盲水印、AI 图片增强/标签/评分
- **限制**：输入最大 32MB，最大 30000×30000 像素，总像素 ≤2.5 亿
- **格式支持**：JPG / BMP / GIF / PNG / WebP / HEIF → TPG / YJPEG / WebP 等

#### 又拍云
- **URL 格式**：`<url>!/<operation>/<param>`（间隔标识符默认 `!`，可配置为 `-` 或 `_`）
- **操作集**：
  - `/thumb/500x500` — 缩略图
  - `/format/webp` — 格式转换
  - `/rotate/90` — 旋转
  - `/watermark/text/<Base64Text>` — 文字水印
  - `/blur/5/2` — 高斯模糊
  - `/quality/80` — 质量调节
- **特色**：WebP 自适应（自动检测客户端支持，未缓存时实时生成）

#### AWS / MinIO
- **无原生图片处理**。需借助 Lambda@Edge 或外部服务。

**产品设计**：
1. 图片预览面板右侧增加「处理」工具栏
2. 参数选择器：尺寸（宽×高 + 缩放模式）、格式（原格式/WebP/AVIF）、质量滑块、旋转角度
3. 实时预览：参数变化后即时更新预览图（使用带处理参数的签名 URL）
4. 输出：一键复制处理后的 URL / 另存为新文件到当前 Bucket
5. 仅在支持图片处理的厂商（七牛/阿里/腾讯/又拍）展示处理面板

**优先级**：P2

---

### 5.2 音视频转码

**产品目标**：提交异步转码任务，在应用内跟踪任务进度。

**各厂商调研**：

| 厂商 | 服务 | 接口 | 特色 |
|------|------|------|------|
| 七牛云 | Dora pfop | `POST api.qiniu.com/pfop/`，参数 bucket/key/fops/notifyURL/pipeline，返回 persistentId 用于状态查询 | 持久化数据处理，支持音视频转码+截图 |
| 阿里云 | IMM 智能媒体管理 | `x-oss-async-process` Header 触发异步处理 | 与 OSS 深度集成 |
| 腾讯云 | MPS 媒体处理 | 独立服务 API，支持标准转码/极速高清(TSC)/自适应码流/截图/雪碧图 | H.265 TSC 极速高清转码 |
| 又拍云 | 基础转码 | CDN 集成 | 能力有限 |
| AWS | MediaConvert | 独立服务，需额外配置 | 功能强大但配置复杂 |

**产品设计**：
1. 视频/音频文件右键 →「转码」
2. 选择模板（如 H.264 720p / H.265 1080p / 仅提取音频 MP3）
3. 提交后在传输/任务列表中追踪状态
4. 此功能为 P3，建议作为独立模块插件化

**优先级**：P3

---

### 5.3 文件预览增强

**产品目标**：桌面级文件管理器的核心体验——无需下载即可预览文件。

**设计方案**：

| 文件类型 | 预览方式 | 技术方案 |
|---------|---------|---------|
| 图片 (jpg/png/gif/webp/svg) | 缩放、旋转、EXIF 信息 | `<img>` + 签名 URL + 鼠标滚轮缩放 |
| 文本 / 代码 | 语法高亮 | Shiki / CodeMirror + 签名 URL 获取内容 |
| Markdown | 格式化渲染 | react-markdown |
| PDF | 嵌入式查看 | pdf.js |
| 音频 (mp3/aac/flac) | 内置播放器 | HTML5 `<audio>` + 签名 URL |
| 视频 (mp4/webm) | 内置播放器 | HTML5 `<video>` + 签名 URL |
| 其他 | 显示元信息 | 文件名、大小、MIME、修改时间 |

**优先级**：P1 — 预览是桌面文件管理器的标配

---

## 六、第四层：可观测性

### 6.1 存储用量统计

**各厂商 API**：

| 厂商 | API | 返回数据 |
|------|-----|---------|
| 七牛云 | Bucket 统计 API | 存储量、对象数 |
| 阿里云 | `GET /?stat` 返回 Storage / ObjectCount / StandardStorage / InfrequentAccessStorage / ArchiveStorage / ColdArchiveStorage / LastModifiedTime，数据延迟 ≥1 小时 | 按存储类型分类的用量 |
| 腾讯云 | COS 监控接口 | 存储量、请求数、流量 |
| AWS | CloudWatch `BucketSizeBytes` + `NumberOfObjects`（每日粒度，无额外费用） | 总量+对象数 |
| MinIO | Admin API `ServerInfo()` / `ServiceStatus()` | 磁盘使用量、在线/离线磁盘数 |

**产品设计**：
1. 侧边栏 Bucket 列表旁显示存储量标签（如 "2.3 GB"）
2. Bucket 详情页展示存储类型分布（标准/低频/归档占比）

**优先级**：P2

---

## 七、Provider 接口扩展设计

为支持上述功能，Go 后端的 Provider 接口需从"单一大接口"演进为**接口组合**模式。

### 7.1 接口分层

```go
// 基础接口 — 所有厂商必须实现
type Provider interface {
    Init(account *model.Account) error
    ListBuckets() ([]model.Bucket, error)
    ListObjects(bucket, prefix, marker string, limit int) (*model.ObjectList, error)
    UploadObject(bucket, key string, reader io.Reader, size int64) error
    DownloadObject(bucket, key string, writer io.Writer) error
    DeleteObjects(bucket string, keys []string) error
    RenameObject(bucket, oldKey, newKey string) error
    GenerateURL(bucket, key, domain string, expiry int64) (string, error)
    GetProviderFeatures() []string
}

// CDN 能力接口
type CDNProvider interface {
    RefreshCDN(urls []string) error
    PrefetchCDN(urls []string) error
    ListDomains(bucket string) ([]model.Domain, error)
    GetRefreshQuota() (*model.CDNQuota, error)         // 查询每日配额
    GetBandwidthStats(domain string, start, end time.Time) ([]model.DataPoint, error)
    GetTrafficStats(domain string, start, end time.Time) ([]model.DataPoint, error)
}

// 存储配置接口
type StorageConfigProvider interface {
    GetLifecycleRules(bucket string) ([]model.LifecycleRule, error)
    PutLifecycleRules(bucket string, rules []model.LifecycleRule) error
    DeleteLifecycleRules(bucket string) error
    GetCORSRules(bucket string) ([]model.CORSRule, error)
    PutCORSRules(bucket string, rules []model.CORSRule) error
    GetRefererConfig(bucket string) (*model.RefererConfig, error)
    PutRefererConfig(bucket string, config *model.RefererConfig) error
    GetEncryption(bucket string) (*model.EncryptionConfig, error)
    PutEncryption(bucket string, config *model.EncryptionConfig) error
}

// 版本管理接口
type VersioningProvider interface {
    GetVersioning(bucket string) (string, error)    // "Enabled" | "Suspended" | ""
    PutVersioning(bucket string, enabled bool) error
    ListObjectVersions(bucket, prefix, keyMarker, versionMarker string, limit int) (*model.VersionList, error)
    DeleteObjectVersion(bucket, key, versionId string) error
}

// 图片处理接口
type ImageProcessProvider interface {
    GenerateProcessURL(bucket, key, domain string, ops []model.ImageOp) (string, error)
}

// 异步任务接口（转码等）
type AsyncJobProvider interface {
    SubmitJob(bucket, key string, params model.JobParams) (string, error)
    GetJobStatus(jobId string) (*model.JobStatus, error)
}

// 统计接口
type StatsProvider interface {
    GetBucketStats(bucket string) (*model.BucketStats, error)
}
```

### 7.2 Feature Flag 动态发现

前端通过 `GET /api/v1/accounts/:id/features` 获取当前账号支持的功能列表，条件渲染 UI。

扩展后的 features 枚举：

| Feature Flag | 含义 | 支持厂商 |
|-------------|------|---------|
| `cdnRefresh` | CDN 缓存刷新 | 七牛、阿里、腾讯、又拍、AWS |
| `cdnPrefetch` | CDN 预热 | 七牛、阿里、腾讯、又拍 |
| `cdnDomains` | CDN 域名管理 | 七牛、阿里、腾讯、又拍、AWS |
| `cdnStats` | CDN 统计 | 七牛、阿里、腾讯、又拍、AWS |
| `lifecycle` | 生命周期规则 | 七牛、阿里、腾讯、AWS、MinIO |
| `cors` | CORS 配置 | 七牛、阿里、腾讯、AWS、MinIO |
| `referer` | 防盗链 | 阿里、腾讯、七牛(CDN层) |
| `encryption` | 服务端加密 | 阿里、腾讯、AWS、MinIO |
| `versioning` | 版本管理 | 阿里、腾讯、AWS、MinIO |
| `imageProcess` | 图片处理 | 七牛、阿里、腾讯、又拍 |
| `asyncJob` | 异步任务(转码) | 七牛、阿里、腾讯 |
| `bucketStats` | 存储统计 | 七牛、阿里、腾讯、AWS、MinIO |
| `fetchURL` | URL 抓取上传 | 七牛 |
| `customDomain` | 自定义域名 | 又拍 |

前端根据 features 数组动态显示/隐藏功能入口，未支持的功能不渲染 UI 元素，保持界面简洁。

---

## 八、新增 API 端点规划

### 8.1 CDN 管理

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| POST | `/api/v1/cdn/refresh` | 缓存刷新 | ✅ 已有 |
| POST | `/api/v1/cdn/prefetch` | 预热 | 新增 |
| GET | `/api/v1/cdn/quota` | 查询每日刷新/预热配额 | 新增 |
| GET | `/api/v1/cdn/domains` | 域名列表 | 新增 |
| GET | `/api/v1/cdn/stats/bandwidth` | 带宽统计 | 新增 |
| GET | `/api/v1/cdn/stats/traffic` | 流量统计 | 新增 |

### 8.2 Bucket 配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT/DELETE | `/api/v1/buckets/:bucket/lifecycle` | 生命周期规则 |
| GET/PUT | `/api/v1/buckets/:bucket/cors` | CORS 配置 |
| GET/PUT | `/api/v1/buckets/:bucket/referer` | 防盗链配置 |
| GET/PUT | `/api/v1/buckets/:bucket/encryption` | 加密配置 |
| GET/PUT | `/api/v1/buckets/:bucket/versioning` | 版本控制 |
| GET | `/api/v1/buckets/:bucket/stats` | Bucket 用量统计 |

### 8.3 版本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/buckets/:bucket/objects/versions` | 列出对象历史版本 |
| DELETE | `/api/v1/objects/version` | 删除指定版本 |

### 8.4 数据处理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/objects/process-url` | 生成图片处理 URL |
| POST | `/api/v1/jobs` | 提交异步处理任务 |
| GET | `/api/v1/jobs/:jobId` | 查询任务状态 |

---

## 九、前端体验补全（P0-P1）

以下是达到"可用"标准必须完成的前端工作，优先级高于所有云端新功能。

### 9.1 P0 阻断性修复

| # | 问题 | 方案 | 涉及组件 |
|---|------|------|---------|
| 1 | 文件大小显示原始字节 | `formatFileSize()` 工具函数 → "1.2 MB" | ResourceTable, ResourceGrid, TransferList |
| 2 | 时间戳未格式化 | `date-fns` formatDistanceToNow → "2 小时前" | 所有文件列表 |
| 3 | 重命名用 window.prompt() | Radix Dialog + 受控输入框 | RenameDialog |
| 4 | 删除无确认 | 确认对话框，显示文件名，危险操作红色按钮 | DeleteConfirmDialog |
| 5 | 操作无反馈 | Sonner toast 集成到所有 mutation hook | useCloudApi 各 hook |

### 9.2 P1 核心交互

| # | 功能 | 方案 |
|---|------|------|
| 6 | 面包屑导航 | 路径分段可点击，支持拖拽文件到面包屑项移动 |
| 7 | 批量选择 | 复选框列 + Shift 连选 + 全选/反选 + 批量操作栏 |
| 8 | 右键上下文菜单 | Radix ContextMenu 集成到 ResourceTable/Grid |
| 9 | 虚拟滚动 | TanStack Virtual 集成，支撑 10000+ 文件列表 |
| 10 | 搜索防抖 | 300ms debounce，减少 API 请求 |
| 11 | 键盘快捷键 | Ctrl+U 上传 / Delete 删除 / F2 重命名 / Ctrl+R 刷新 / Ctrl+A 全选 |
| 12 | 命令面板 | cmdk 集成（Cmd+K / Ctrl+K），快速切换 Bucket/账号/操作 |
| 13 | 文件类型图标 | 根据扩展名渲染图标（图片/视频/文档/压缩包/代码等） |
| 14 | 传输速度 & ETA | 基于 SSE 进度事件计算瞬时速度和预估剩余时间 |
| 15 | 大文件分片上传 | S3 Multipart Upload（CreateMultipartUpload → UploadPart → Complete），阈值 50MB |

---

## 十、实施路线图

### Phase 1：基础体验达标（4 周）
- P0 缺陷全部修复（格式化/对话框/Toast）
- 面包屑导航 + 批量操作 + 右键菜单
- 虚拟滚动 + 搜索防抖
- 文件预览 V1（图片 + 文本/代码）
- 修复又拍云 RefreshCDN 和 ListDomains 空实现

### Phase 2：CDN 管理全覆盖（3 周）
- 阿里云 CDN 刷新/预热（引入 alibaba-cloud-sdk-go/services/cdn）
- 腾讯云 CDN 刷新/预热（引入 tencentcloud-sdk-go/cdn/v20180606）
- AWS CloudFront 缓存失效（引入 aws-sdk-go-v2/service/cloudfront）
- 又拍云 Purge 接口修复
- CDN 配额查询 + 上传后自动刷新选项
- CDN 域名管理 UI

### Phase 3：存储治理（4 周）
- 生命周期规则管理（全厂商适配）
- CORS 配置管理
- 防盗链配置
- 版本控制 + 版本历史列表
- Bucket 加密配置

### Phase 4：智能处理 + 预览增强（3 周）
- 图片处理 URL 生成器（七牛/阿里/腾讯/又拍）
- 文件预览 V2（PDF / 音视频 / Markdown）
- 大文件分片上传

### Phase 5：监控统计 + 打磨（3 周）
- 存储用量统计面板
- CDN 带宽/流量趋势图（Recharts）
- 命令面板 + 键盘快捷键
- 国际化补全（消除硬编码文本）
- 性能优化 + 边界情况处理

### Phase 6：高级特性（持续迭代）
- 音视频转码任务管理
- 腾讯云数据万象 AI 能力
- AWS S3 Select 就地查询
- MinIO 事件通知配置 + Admin API 集成
- 跨区域复制管理

---

## 十一、Go 后端新增 SDK 依赖

| 厂商 | 新增包 | 用途 |
|------|--------|------|
| 阿里云 | `github.com/aliyun/alibaba-cloud-sdk-go/services/cdn` | CDN 刷新/预热/域名/统计 |
| 阿里云 | `github.com/aliyun/alibabacloud-oss-go-sdk-v2`（升级） | 生命周期/CORS/Referer/加密/版本管理/统计 |
| 腾讯云 | `github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/cdn/v20180606` | CDN 刷新/预热/域名/统计 |
| AWS | `github.com/aws/aws-sdk-go-v2/service/cloudfront` | CloudFront 缓存失效/域名 |
| AWS | `github.com/aws/aws-sdk-go-v2/service/cloudwatch` | S3 存储指标 |
| MinIO | `github.com/minio/madmin-go`（新增） | Admin API: 用户管理/服务状态/磁盘指标/Prometheus 指标 |

---

## 十二、技术风险

1. **CDN SDK 独立性**：阿里云和腾讯云的 CDN API 使用独立的 SDK 和鉴权体系（虽然可复用 AK/SK），Go 后端需要为每个厂商维护两套 client（存储 + CDN）。建议在 Provider 工厂中按需延迟初始化 CDN client。

2. **AWS CloudFront Distribution ID**：S3 Bucket 和 CloudFront 分发之间没有直接关联 API，需要用户手动配置或通过 ListDistributions 遍历 Origins 自动匹配。后者在分发数量多时有性能开销。

3. **又拍云全量适配成本**：又拍云使用完全自定义的 REST API（非 S3 兼容），每个新功能都需要手工实现 HTTP 签名和请求封装，开发成本约为 S3 兼容厂商的 2-3 倍。Go SDK (`go-sdk`) 覆盖的 API 面不够广，CDN Purge、域名管理等需自行封装。

4. **各厂商 API 配额差异大**：CDN 刷新配额从 100 条/天（阿里云目录）到 10000 条/天（腾讯云 URL）差异显著，前端必须做好配额查询和剩余量提示，避免用户遇到 429 报错。

5. **大文件分片上传**：当前上传实现未支持 Multipart Upload，大文件（>100MB）上传存在超时或 OOM 风险。S3 协议要求每个分片 ≥5MB、≤5GB、最多 10000 个分片。需在 Go 后端实现 CreateMultipartUpload → UploadPart → CompleteMultipartUpload 流程，前端展示分片进度。

6. **图片处理 URL 安全性**：各厂商的图片处理通过 URL 参数实现，私有 Bucket 的图片需要先生成签名 URL，再附加处理参数。需注意签名 URL 中的参数不能被处理参数覆盖——阿里云使用 `?x-oss-process=`，七牛云使用 `?imageView2/`，两者参数位置和签名方式不同。

---

## 十三、竞品对标

| 维度 | Cloud Pika (目标) | Cyberduck | S3 Browser | CloudBerry |
|------|------------------|-----------|------------|------------|
| CDN 缓存刷新 | ✅ 多云 | ❌ | ❌ | ❌ |
| CDN 域名管理 | ✅ 多云 | ❌ | ❌ | ❌ |
| 生命周期规则 | ✅ 可视化 | ❌ | ✅ (AWS only) | ✅ |
| CORS 配置 | ✅ 可视化 | ❌ | ✅ (AWS only) | ❌ |
| 版本管理 | ✅ 多云 | ✅ (S3) | ✅ (S3) | ✅ |
| 图片处理 | ✅ 原生集成 | ❌ | ❌ | ❌ |
| 中国云厂商 | ✅ 七牛/阿里/腾讯/又拍/京东/金山 | 部分 | ❌ | ❌ |
| 开源 | ✅ | ✅ (GPL) | ❌ | ❌ |
| 包体积 | ~20MB (Tauri) | ~100MB (Java) | ~30MB | ~50MB |

CDN 管理和中国云厂商深度集成是 Cloud Pika 相对竞品最明显的差异化壁垒。

---

*本文档基于 2026 年 4 月各云厂商官方 Open API 文档和 Go SDK 源码编写。具体 API 参数和配额以厂商最新文档为准。*

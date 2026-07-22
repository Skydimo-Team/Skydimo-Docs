# Skydimo 更新、Feature Flag 与资源交付路线分析

> 状态：讨论稿（Decision Proposal）
>
> 记录日期：2026-07-23
>
> 范围：可行性与架构分析，不代表相关功能已经实施

## 1. 结论摘要

整体方案可行，方向也较务实，但原始阶段划分低估了 Skydimo 的双进程模型、资源可信链和版本兼容问题。

- Windows x64 跑通版可在 1–2 周完成，但需要严格限制为 Simple 安装壳、完整 NSIS 更新、单一稳定通道，并由多条工作线并行推进。
- 一名工程师完成第一阶段生产版，更现实的周期是 4–6 周。
- 跨平台更新、安全资源热更新、自动回滚和差分更新不属于 1–2 周范围。
- 项目不是从零开始：更新检查、Gitea 发布、PostHog、错误捕获、插件重载和 Launcher 均已有基础，但尚未形成生产级闭环。

建议在正式第一阶段之前增加一个短暂的“阶段 0”，先确定更新原子单元、协议兼容契约和签名信任模型。

## 2. 当前项目基础

### 2.1 更新与发布

- 前端已有更新检查接口和更新弹窗，但“立即更新”目前只打开下载地址，并不自动下载或安装。
- Gitea Release 流程已覆盖 Windows 构建、严格 Clippy、Core 测试、依赖审计、Authenticode 签名、安全扫描和发布。
- Simple 是当前正式安装包，会将 Core 与 bundled plugins 一起作为 NSIS resources 安装。
- Advanced UI 和 Launcher 目前以独立 Release asset 形式发布，不属于同一原子安装单元。
- 两个 Tauri 壳均尚未接入 `tauri-plugin-updater`，发布流程也未生成 updater 签名和 manifest。

### 2.2 Telemetry 与错误上报

- Core 已接入 PostHog，并默认关闭统计，要求用户明确同意。
- Rust panic 可以暂存为待上报异常；应用退出时会尝试 flush。
- Tauri 已提供手动反馈上传，可收集日志和诊断信息。
- React 与 Tauri 自身异常目前主要写入本地日志，尚未形成统一远程上报链路。

### 2.3 插件与资源

- Core 已区分 bundled、installed、dev 和 data 等插件来源。
- Lua 插件已经区分只读资源目录与持久化数据目录。
- 插件管理器具备停止、重新扫描、重启和通知 UI 的基础生命周期能力。
- NativeC DLL 使用内容哈希影子副本，能够降低 Windows 文件占用对替换的影响，但不等于具备安全热更新能力。

### 2.4 Launcher

仓库已有 Launcher，但它目前只是读取 `frontendPath` 并启动同目录前端的轻量转发器，不具备网络下载、安装、健康检查、修复或回滚能力。因此后续讨论中的“启动器”应理解为扩展现有 Launcher，而不是从零创建。

## 3. 分项可行性与工作量

以下工期为熟悉项目的工程师估算，不包含需求反复、外部基础设施采购或跨平台签名审批时间。

| 项目 | 可行性 | 预计工作量 |
|---|---|---:|
| Tauri Windows 完整包自动更新 | 高 | 7–10 工程日 |
| 基础 JSON Feature Flag | 高 | MVP 3–5 日；生产化 8–12 日 |
| 现有错误上报可靠化 | 高 | 5–8 日 |
| Lua/静态资源初步分离 | 高 | 2–4 日 |
| UI 存活期间后台下载、确认后安装 | 高 | updater 完成后 1–2 日 |
| UI 退出后继续下载 | 中 | 额外 3–5 日以上 |
| 完整安全资源热更新 | 中高 | 3–6 周 |
| Windows 主程序二进制差分 | 中 | 3–6 周 |
| AI 自动生成 Draft PR | 中 | 数据闭环完成后 2–4 周 PoC |
| Wasm effect-only PoC | 中高 | 2–3 周；生产化 4–8 周 |

## 4. 自动更新分析

### 4.1 第一阶段更新单元

第一阶段建议把以下内容视为一个原子更新单元：

```text
Simple UI + Core + bundled plugins
```

Simple 应是唯一 updater owner。Advanced 暂不独立调用 Tauri updater，原因包括：

- Advanced 当前是单独发布的 portable executable，不是安装 bundle。
- 两个前端若分别更新，可能出现新 UI、旧 Core、旧插件相互混搭。
- Advanced 发布物命名为 `skydimo-advanced.exe`，而 Simple 当前切换逻辑寻找同目录的 `skydimo.exe`，部署链路仍需统一。

Gitea 可以继续作为发布和制品来源，无需为了 updater 迁移到 GitHub。推荐由现有 HTTPS API 返回 Tauri 动态更新 manifest，由 Gitea 或 CDN 提供已签名安装包。若 Gitea Release 是私有的，不应在桌面客户端中嵌入访问 token。

### 4.2 双进程安装时序

Skydimo 的 UI 退出后，Core 可以继续驻留托盘。若直接运行安装器，可能产生以下问题：

1. 老 Core 占用 `skydimo-core.exe`；
2. 新 UI 重启后附着到老 Core；
3. UI、Core 和插件版本形成不受支持的组合。

推荐安装流程：

```text
下载并完成 updater 签名验证
→ 用户确认“重启并安装”
→ prepare_update
→ 向 Core 发送认证关闭命令并等待进程退出
→ 执行安装
→ 重启并完成健康检查
```

`on_before_exit` 可作为额外防线，但不能代替可失败、可阻止安装的 `prepare_update`。NSIS 安装阶段也应再次检查 Core 是否仍在运行。

### 4.3 签名与供应链

需要区分两套签名：

- Authenticode：Windows 对 executable 和 installer 的系统信任；
- Tauri updater 签名：客户端验证更新制品完整性和发布者的独立签名。

Updater 私钥必须：

- 与 Authenticode 凭据分离；
- 存放在 CI 密钥或专用签名设施中；
- 离线备份；
- 设计丢失、泄露和轮换处理流程。

### 4.4 更新策略

- 默认采用软更新，允许用户稍后安装。
- 只有严重安全问题或协议完全不兼容时，才通过 `minimumSupportedVersion` 阻断旧版本。
- 不建议继续把一个通用 `forceUpdate` 布尔值作为日常发布工具。
- 第一阶段只支持 UI 进程存活期间后台下载；若要求 UI 退出后继续下载，需要将下载状态机移入 Core、让 UI 常驻隐藏，或扩展 Launcher/helper。

## 5. 版本与协议兼容

当前 Control Socket 主要校验端口和 runtime profile，缺少明确的版本协商。自动更新或独立资源更新前，应至少增加：

- `coreVersion`
- `rpcProtocolVersion`
- UI 支持的 `minProtocolVersion` / `maxProtocolVersion`
- Plugin Host API 或 ABI 兼容范围

不要求 UI 与 Core 的 patch 版本完全一致，但不兼容组合必须拒绝连接，并给出可恢复提示。

当前预发布版本使用类似 `3.0.3-rc9` 的形式。后续建议改为 `3.0.3-rc.9`，避免字符串型 prerelease 标识在 `rc9`、`rc10` 等版本之间产生非预期排序。Telemetry 的 release channel 判定也需要正确识别 RC，避免将其归入 stable。

## 6. Feature Flag 分析

### 6.1 推荐架构

第一版建议采用 Core-owned 的签名 JSON，而不是由 React 或 Tauri 直接拉取配置：

```text
编译时安全默认值
       ↓
本地最后有效快照（LKG）
       ↓
后台刷新签名 JSON
       ↓
Core 评估并通过 JSON-RPC 暴露结果
```

配置至少应包含：

- `schemaVersion`
- 单调递增的 `revision`
- `expiresAt`
- 强类型 `flags`
- `keyId` 与签名

关键原则：

- 启动不能等待网络；
- 网络失败时使用最后有效快照；
- AI、云成本和安全相关能力在无有效快照时默认关闭；
- 成熟的本地效果默认开启；
- Flag 拉取独立于统计同意，不因用户拒绝 telemetry 而失效；
- Flag 服务不能演变成下载和执行任意代码的通道。

### 6.2 后端权威

Flag 不能只隐藏前端入口，至少需要覆盖三层：

1. catalog：不向 UI 展示不可用功能；
2. command：直接调用 RPC 时也必须拒绝；
3. runtime：Flag 关闭后安全停止已运行功能、释放 LED 锁和资源，并切换到安全 fallback。

同时应区分用户选择与发布可用性：

```text
用户启用状态 ≠ 发布可用状态
effective_available = user_enabled && rollout_available
```

远端关闭不能写回用户的 `plugins.json` 或覆盖其选择。

### 6.3 AI 边界

Feature Flag 只负责入口和发布节奏，不是授权或费用控制。AI entitlement、套餐、配额和速率限制必须由服务端强制执行。AI prompt、稳定用户 ID、API Key 和第三方模型数据流也需要独立的隐私说明，不能被笼统包含在匿名统计同意中。

### 6.4 PostHog 与 Unleash

- 如果只需要发布控制，第一阶段的签名 JSON 最务实；复杂度上升后可迁移到 Unleash。
- 如果同时需要产品分析、实验和错误聚合，可以继续扩展现有 PostHog。
- 不建议仅为了 Feature Flag 自托管 PostHog，其运维成本明显高于专门的 Flag 控制面。
- 无论选择哪种供应商，Core 都应保留默认值、LKG、离线策略和最终强制执行。
- PostHog local-evaluation secret 和 Unleash backend token 不能编译进桌面客户端；应使用 Skydimo relay、Frontend API，或下发已经评估的公开结果。

## 7. 错误上报分析

现有错误上报已经“跑起来”，但仍需补齐可靠性和隐私语义。

### 7.1 主要缺口

- 上传队列无界，失败后缺少可靠重试和磁盘 spool；
- pending panic 可能在确认服务端接收前被删除；
- telemetry 开关持久化失败时，RPC 仍可能返回成功；
- React 的 `window.error`、`unhandledrejection` 和 Tauri panic 主要停留在本地日志；
- 缺少 build SHA、崩溃指纹、符号/source map、去重、速率限制和告警闭环；
- 异常消息和上下文需要统一字段白名单与脱敏；
- 原生 access violation、abort 和 NativeC DLL 崩溃需要额外的 minidump、Crashpad 或 WER 能力。

### 7.2 第一阶段建议

- `set_enabled` 必须传播持久化失败；
- 撤回同意时停止发送并清理尚未上传的分析队列；
- 使用有界内存队列和有界磁盘 crash spool；
- 加入指数退避、去重、速率限制和成功确认后删除；
- React、Tauri、Core 共用字段白名单和脱敏策略；
- 前端错误经 Core RPC 上报，由 Core 统一检查同意状态；
- 禁止上传 prompt、API Key、原始 RPC 参数、完整用户路径及设备序列号。

当前界面所称“匿名统计”实际使用稳定 distinct ID，更准确的描述应是“假名化使用与诊断数据”。长期建议把“产品分析”和“崩溃诊断”拆成两个独立开关。

## 8. 资源分离与热更新

### 8.1 第一阶段可分离的内容

- Lua 插件与效果；
- 本地化文件；
- 静态图片和扩展页面；
- 设备描述、预设等非原生执行内容。

NativeC DLL、驱动、外部进程和 Host ABI 变更仍应跟随主程序签名发布。

### 8.2 资源分类

建议把资源分成三个发布域：

1. 协调更新单元：Simple、Core、Launcher、NativeC 插件；
2. 签名可管理内容：Lua、页面、本地化、图片、效果包；
3. 用户数据：配置、插件 data、用户预设，不得被更新覆盖。

根据运行时影响再分为：

- 可即时切换：静态图片、语言包、设备描述；
- 可停止并重启插件：Lua effect、Lua extension；
- 需要设备重新枚举：controller；
- 必须重启 Core：NativeC、外部进程、驱动、Host ABI 变更。

### 8.3 生产级热更新前置条件

当前插件导入流程尚不是 staging + 原子切换，失败时可能丢失旧版本。正式资源热更新至少需要：

- 签名索引和逐文件哈希；
- manifest schema 与合法 SemVer；
- Core/Host API 兼容范围；
- OS/架构和依赖约束；
- 下载大小、文件数量、解压总量和压缩比限制；
- 版本化或内容寻址目录；
- 非活动环境预加载检查；
- 原子切换 current 指针；
- 健康观察和自动回滚；
- 保留当前版本、N-1 和内置 fallback；
- 防降级、过期和防混搭策略。

推荐流程：

```text
流式下载到 staging
→ 验证签名元数据
→ 限额解压
→ 校验文件哈希与大小
→ 在非活动环境预加载
→ 写入版本目录
→ 原子切换 current
→ 重启受影响插件
→ 健康观察
→ 失败则回滚 N-1
```

“拆分目录”不等于已经具备安全热更新能力。

## 9. 差分更新

差分更新技术可行，但应由指标触发，而不是固定里程碑。

优先顺序建议：

1. 资源按文件哈希增量下载或内容寻址；
2. 继续保留完整包 fallback；
3. 只有主程序体积、CDN 流量或更新时间成为实际瓶颈后，才开发二进制 patch。

决定前应持续监控：

- 完整包体积；
- 下载时间与失败率；
- CDN 流量与成本；
- 用户跳过率；
- patch 命中率和 fallback 率。

Windows 二进制差分还需处理基础版本精确匹配、基础文件哈希、patch 签名、输出文件完整性、磁盘空间、文件锁、失败回退和回滚，复杂度明显高于完整包更新。

## 10. AI Agent 自动提修复

可行，但应严格限定为自动生成 Issue 或 Draft PR，不允许自动合并和发布。

建议流程：

```text
反馈/遥测
→ 脱敏和去重
→ 创建 Issue
→ 固定版本复现
→ Agent 在临时分支生成失败测试和最小补丁
→ 创建 Draft PR
→ 常规 CI 与安全检查
→ 人工 Review
→ 正常签名、灰度和发布
```

Agent 不得：

- 自动合并 PR；
- 持有生产发布或 updater 签名密钥；
- 修改 CI 安全策略；
- 默认增加依赖；
- 根据未经清洗的用户日志直接执行命令。

上线前还需要崩溃指纹、build SHA、符号/source map、稳定复现、防 prompt injection、最小权限沙箱和受保护分支。

## 11. Wasm 插件

Wasm 在架构上可行，项目的 runtime 枚举也已经预留相应类型，但目前没有真实 Wasm runtime 或 Wasmtime 依赖。

如果出现明确的跨平台、跨语言或不可信插件隔离需求，建议从 effect-only PoC 开始：

- Effect 输入输出较小，适合定义有限的 WIT world；
- 默认不开 WASI；
- 文件系统、网络、进程、HID 等能力必须显式授权；
- 每个实例独立 Store；
- 设置内存、fuel 或 epoch timeout；
- 按 runtime 版本和 module hash 缓存编译产物；
- 对高频灯效进行实时性能基准测试。

第一轮不建议做 controller 或 extension：两者涉及硬件生命周期、异步网络、进程、页面通信和大量管理 API，Host API 面积显著更大。

Wasm 提供的是沙箱基础，不是自动获得的安全。最终安全边界仍取决于开放的 Host imports、资源限制和包签名。

## 12. 调整后的分阶段路线

### 阶段 0：确定边界与信任模型

建议先用 2–3 天完成设计决策：

- Simple 是唯一 updater owner；
- 定义第一阶段原子更新单元；
- 增加 RPC/Core/Host API 版本契约；
- 定义 updater 与资源签名密钥管理；
- 约定软更新、最低支持版本和恢复路径；
- 统一 RC 与 channel 语义。

### 第一阶段：Windows 跑通

- 接入 Tauri 签名完整包更新；
- 安装前可靠关闭 Core；
- 只上线 3–5 个 Core-owned JSON flags；
- 补强现有 PostHog 错误上报；
- 只完成资源分类和目录边界；
- 不开放在线 NativeC 代码更新。

### 第二阶段：产品化

- Flag 覆盖 catalog、command 和 runtime；
- 根据实际管理需求选择 Unleash，或继续扩展 PostHog；
- 实现 UI 存活期间后台下载，用户确认后安装；
- 建立签名资源包、原子切换、健康检查和回滚；
- 只有需要跨 UI 退出下载、修复或回滚时，才扩展现有 Launcher。

### 第三阶段：指标驱动的进阶能力

- 完善资源热更新和按文件增量；
- 仅在指标证明需要时开发主程序差分更新；
- AI Agent 仅创建 Issue/Draft PR，并强制人工审核；
- 有明确隔离或跨语言需求时再做 Wasm effect PoC。

## 13. 明确不优先及安全红线

原始讨论中的四项判断基本正确，建议正式表述为：

1. 不频繁强制更新主程序，仅保留安全或协议最低支持版本机制；
2. 在线下载并执行未充分验证的原生 DLL，从“不优先”升级为安全禁止项；
3. 第一阶段不建设复杂灰度和多环境，先保留 stable，必要时增加内部 beta；
4. 不把所有能力插件化，协议、安全策略和设备权威逻辑继续留在 Core。

## 14. 最终建议

这条路线建议“有条件通过”：保留总体阶段顺序，但在第一阶段前加入协议兼容和签名信任模型，并把第一阶段明确限定为 Windows MVP。

最重要的三条原则是：

1. 主程序更新先保证原子性和可恢复性；
2. Feature Flag 必须由 Core 最终执行，不能只隐藏 UI；
3. 资源分离必须以签名、兼容检查、原子切换和回滚为生产门槛。

在这些边界下，方案能够循序落地，并与 Skydimo 当前的 Core 权威、前端无关和插件扩展架构保持一致。

## 15. 参考资料

- [Tauri Updater](https://v2.tauri.app/plugin/updater/)
- [Tauri Updater JavaScript API](https://v2.tauri.app/reference/javascript/updater/)
- [Tauri Windows Installer](https://v2.tauri.app/distribute/windows-installer/)
- [PostHog Rust SDK](https://posthog.com/docs/libraries/rust)
- [PostHog Feature Flag Local Evaluation](https://posthog.com/docs/feature-flags/local-evaluation)
- [PostHog Error Tracking](https://posthog.com/docs/error-tracking/capture)
- [Unleash API Overview](https://docs.getunleash.io/api/)
- [Unleash Rust SDK](https://docs.getunleash.io/sdks/rust)
- [The Update Framework Specification](https://theupdateframework.github.io/specification/latest/)
- [Wasmtime Security](https://docs.wasmtime.dev/security.html)
- [WebAssembly Component Model: WIT](https://component-model.bytecodealliance.org/design/wit.html)

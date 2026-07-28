# Skydimo Simple 稳定版发布门禁

> 状态：执行中，当前未通过
> 初次审计日期：2026-07-25
> 最近复核日期：2026-07-28
> 当前实现基线：`codex/simple-stabilization` / `e20c63df`
> 首发范围：Windows x64
> 决策依据：`dev/SIMPLE_FIRST_PRODUCT_ARCHITECTURE_ROADMAP.zh-CN.md`

## 0. 2026-07-28 实施进展

本轮已经在产品仓库内完成并验证以下代码级门禁：

- Simple 仅允许对能力声明完整的线性输出设置灯珠数；Core 使用批量预检、硬件回滚和持久化回滚保证原子更新；
- LED 实时预览保持线缆帧长度高水位，缩小或扩大灯珠数时不发送中间黑帧；
- Core 启动改为非阻塞状态机，并提供可见的启动、失败、重试、打开日志和退出路径；
- 当前设备断开后清空选择并返回首页，不再隐式切换到另一台物理设备；
- 重要更新始终允许延期，只接受 HTTPS 下载地址，打开失败时保留可恢复界面；
- 控制器 manifest 对已声明但非法的 VID、PID 和接口号直接报错，不再静默退化为通配；
- PR CI 已接入 Core、主 UI、Simple UI、Advanced Tauri 和 Simple Tauri 测试，固定 Node 22.18.0，并定向初始化及验证 `plugins/built-in`；
- 本地验证结果为 Core 197 项、主 UI 50 项、Simple UI 26 项、Advanced Tauri 33 项、Simple Tauri 33 项全部通过；两套 UI 生产构建和 Core 严格 Clippy 通过。

上述结果关闭的是代码与本地自动化缺口，不代表稳定版门禁已经通过。仍需实际 Gitea CI 运行证据、外部协议/E2E、真实安装升级卸载、物理设备恢复、24 小时 soak、签名产物和回滚演练。

## 1. 结论

Skydimo 当前应继续执行“先稳定简易版，再建设高级版”的策略。关键代码风险已经显著收敛，但尚不能证明 Simple 可以稳定发布：

- 三个仓库的测试没有绑定到同一个产品提交和同一组二进制；
- 产品 CI 已纳入本仓库单元测试，但尚无实际 Gitea 运行证据，外部协议测试和 Simple 桌面 E2E 仍未接入；
- 真实安装、升级、卸载、硬件恢复和长时间运行尚未形成可追溯报告；
- 发布流程仍被 Advanced/Launcher 产物绑定，且“安装包冒烟”没有实际安装安装包。

因此，当前产物最多可作为内部开发版或 RC 候选，不应标记为普通用户稳定版。

## 2. Simple MVP 范围

### 2.1 必须稳定的普通用户路径

```text
安装 → 启动 → Core 正常连接 → 自动发现设备 → 默认点亮
     → 电源 / 亮度 / 精选灯效 / 基础参数
     → 拔插恢复 → 配置保存 → 重启恢复 → 安全更新
```

必须保留并作为发布门禁：

1. 可见、可恢复的 Core 启动和连接生命周期；
2. 空设备诊断、手动扫描和 USB 热插拔；
3. 单设备电源、亮度、精选灯效和基础参数；
4. 不提供布局编辑；仅对 Core 声明为可调的线性输出设置总灯珠数；
5. 语言、自启动和关闭行为；
6. 设置与设备配置的重启持久化；
7. 更新检查及其失败恢复；
8. 默认关闭、用户明确同意后才启用的遥测。

### 2.2 稳定版之前暂缓

- 复杂 Segment/Matrix 转换；
- 多输出批量 LED 布局编辑；
- 高级版切换入口；
- 会员转化主路径；
- 插件市场和第三方 Controller；
- 快捷键录制、截图后端等专家设置；
- 缺少有效下载地址或恢复路径的强制更新；
- 任何会扩大普通用户认知负担、但不改善“连接并点亮设备”的功能。

暂缓不代表删除底层能力，可以通过构建开关或 UI 隐藏保持代码可继续演进，但不得进入 Simple 稳定版主路径。

## 3. 发布原子与仓库职责

Simple 的可发布原子必须是同一个版本、同一个提交、一次构建得到的：

```text
Simple 安装包
├── Simple UI / Tauri 壳
├── skydimo-core
├── lock 文件明确列出的 bundled plugins
├── 必需的运行时资源
└── 对应的版本、SHA256 和更新渠道元数据
```

Advanced 和 Launcher 均不属于第一阶段 Simple 发布原子，其构建或签名失败不得阻塞 Simple。

当前 Launcher 只读取 `frontendPath` 并启动同目录程序，没有下载、安装、健康检查或回滚能力，不是自动更新器。本阶段保留其源码，但不打入 Simple 安装包、不接管默认启动或 Windows 自启动。Simple 自动更新应使用经过签名验证的完整安装包更新；可以自动检查或后台下载，但安装和重启必须由用户确认。Advanced 真正可交付后，再决定 Launcher 是稳定启动路由器还是退出后的更新/修复辅助程序。

| 仓库 | 职责 | 约束 |
|---|---|---|
| `SkydimoV3` | 产品源码、阻断级快速测试、CI、打包、签名和发布门禁 | 是发布事实来源 |
| `core-Tests` | Core 协议、恢复、持久化、并发和长时间测试 | 必须测试当前产品流水线生成的 Core，不得使用不明版本 |
| `Skydimo-3.0-UI-Tests` | Simple 桌面 E2E、安装测试和硬件实验室编排 | 必须测试当前产品流水线生成的 Simple/Core |

外部测试仓库必须记录以下信息：

- 产品 Git SHA；
- 测试仓库 Git SHA；
- Simple、Core、插件包版本与 SHA256；
- 操作系统、WebView2、设备 SKU/固件；
- 测试命令、开始/结束时间和退出码。

测试仓库可以继续保留，但不得再复制一份不确定版本的产品源码。由产品流水线按精确提交检出测试，或把同一 SHA 的已构建产物交给测试流水线。

## 4. 当前覆盖矩阵

| 用户路径 | 当前覆盖 | 主要缺口 | 发布层级 |
|---|---|---|---|
| 构建、Clippy、Core 单元测试 | 本地已通过 Core 197 项、主 UI 50 项、Simple UI 26 项、Advanced Tauri 33 项和 Simple Tauri 33 项；产品 CI 已纳入这些门禁 | 尚缺实际 Gitea CI 运行证据和外部测试仓库结果 | PR |
| Simple 启动、Core 拉起 | 已有非阻塞启动状态机、单飞重试、故障页和壳层单元测试 | 缺打包后的 Core 缺失/慢启动/错误 profile E2E，以及运行期崩溃恢复 | PR + Nightly |
| WebSocket 连接/重连 | Core 协议测试较多 | Simple transport/hooks 无单元测试；缺 kill/restart 恢复 E2E | PR + Nightly |
| 空设备、扫描、热插拔 | Core discovery/reconcile 有覆盖 | Simple 空态和驱动异常 UX 缺失 | PR + Hardware |
| 电源、亮度、灯效、参数 | Core/协议/E2E 均有部分覆盖 | 多数 E2E 只看 UI，未回查 Core 权威状态和失败回滚 | PR |
| 配置保存、重启恢复 | Core store/profile 单元测试较强 | `core-Tests` 默认跳过 persistence；Simple 无重启 E2E | PR + Nightly |
| LED 灯珠数设置 | Core 已覆盖安全结构、批量提交、硬件失败回滚和落盘失败回滚；前端有能力校验测试 | 缺真实可调 SKU、固定 SKU 和 legacy 配置的打包程序验收及重启 E2E | PR + Hardware |
| 设置、语言、自启动、关闭行为 | 有部分壳层及 UI 测试 | 关闭行为只改选项，未真正关窗并验证进程 | Nightly |
| 更新、遥测、反馈、会员 | 有少量单元/接口能力 | 缺关键失败路径和更新渠道闭环 | PR + RC |
| 安装、升级、卸载、回退 | 有构建和产物脚本 | 当前 smoke 明确不运行安装器 | Nightly + RC |
| 真实 USB 插拔、掉电、欠压 | 有 G857D 功能脚本 | 没有物理控制、当前版本报告和 CI 门禁 | Hardware |
| 长时间运行、休眠/唤醒 | 有循环/性能脚本 | 未绑定当前版本和最终发布产物 | Hardware + RC |

## 5. 未关闭的发布阻断项

严重度定义：

- **P0**：可能导致配置破坏或主程序不可用；任何 P0 均禁止生成公开 RC。
- **P1**：Simple 核心路径错误、状态失真或无法自动恢复；稳定版必须清零。
- **P2**：有明确绕行方法且不破坏核心路径；仅允许有负责人、期限和书面风险接受时随版本发布。

### 5.1 P0

#### P0-1：Simple 必须停止编辑布局，只允许设置安全的线性灯珠数

当前编辑器可把已有多 Segment、Matrix 或 transform 的输出视为“已修改”，即使用户没有编辑，也可保存成单个 Linear Segment，并清空 `matrix/transform`。

产品决策与发布门禁：

- Simple UI 不提供 Segment、Matrix、Preset、方向翻转或复杂布局转换；
- 固定布局仍由 Core/Controller 保存和只读使用，Simple 不得改写；
- 只有 Controller 通过 `editable + min/max/allowed_total_leds` 声明可调的线性输出才显示“设置灯珠数”；
- UI 不硬编码型号，型号白名单和范围由 Controller 插件负责；
- 多段、矩阵或其他复杂结构由 Core RPC 直接拒绝；
- 增加固定布局无入口、legacy 单 Linear 无损保存、离散允许值、取消和重启恢复测试。

证据：`simple/src/features/devices/components/LedEditDialog.tsx`。

#### P0-2：Core 启动失败时应用可能完全不可见

主窗口默认隐藏，只有 Core 启动和 profile 校验成功后才显示。缺少 Core、无执行权限、握手超时或 profile 错误时，`setup` 返回错误并最终退出。迁移标记无效时握手超时可放宽到 30 分钟。

发布门禁：

- 启动故障必须显示本地化错误页；
- 提供“重试、打开日志、退出”；
- 迁移阶段显示明确的准备状态，不展示无法从 Core 获得的虚假百分比；等待期间窗口始终可响应、可打开日志并可退出；
- 保留明确的技术超时上限，并在取得真实迁移耗时数据后收紧；
- 自动测试缺 Core、慢 Core、错误 profile、端口冲突和启动后崩溃。

证据：`simple/src-tauri/tauri.conf.json`、`simple/src-tauri/src/lib.rs`。

### 5.2 P1

| 编号 | 风险 | 必须达到的结果 |
|---|---|---|
| P1-1 | 拔掉当前设备后，详情页可能静默切换到另一台设备 | 立即清空选择并回首页；后续 RPC 绝不能误发到另一设备 |
| P1-2 | 首次连接失败、WS 中断或 Core 崩溃后，监听和快照可能永久失步 | 自动重新连接、重新订阅并拉取 Core 权威快照；每类事件只有一个监听 |
| P1-3 | 电源、亮度、灯效和参数失败时，多数只写日志并保留虚假 UI 草稿 | 显示错误、回滚到 Core 值、允许重试，并保证最终提交值生效 |
| P1-4 | 多输出 LED 保存非事务性，且忽略 `allowed_total_leds` | 禁止部分成功不可见；只能提交设备声明允许的离散值 |
| P1-5 | `forceUpdate=true` 且 URL 缺失/非法/打不开时，可永久锁死 UI | 自动更新完成前，强制更新只作高优先级提醒、不锁屏；只接受 HTTPS URL，失败可重试或稍后处理 |
| P1-6 | 发布流程被 Advanced/Launcher 强耦合 | Simple 独立构建、验证、签名和发布；本阶段不把 Launcher 加入启动链 |
| P1-7 | 打包内容没有插件 lock/allowlist | 精确验证插件 ID、版本、入口和 SHA；禁止目录中额外插件被顺带打包 |
| P1-8 | CI 子模块 checkout 不可重复 | 干净 Runner 必须能检出 `plugins/built-in`，不得依赖工作目录残留 |
| P1-9 | 更新发布未闭环到客户端查询服务 | CI 先生成 draft 元数据；人工确认后才提升 stable 渠道，并保留暂停/撤回能力 |

当前代码实施状态：

- P0-1 的破坏性布局写入路径已从 Simple UI 和新 RPC 边界移除；多输出灯珠数通过单次批量 RPC 预检、提交、落盘及失败回滚；
- P0-2 已实现可见启动状态、失败恢复、重试、日志和退出；静默自启动可被普通启动提升为交互模式，恢复页普通退出与“关闭到托盘”不会误停非本 UI 所有的 Core，只有明确的 `ExitApp` 保留关闭共享 Core 的语义；
- P1-1、P1-4、P1-5 已完成代码与单元测试修复，外部 UI 测试已对齐，但仍需在安装包和真实设备上执行后才能从发布门禁中正式关闭；
- P1-8 已通过定向初始化 `plugins/built-in`、拒绝空插件根目录以及逐插件入口校验落实到产品 CI 和发布资产脚本；仍需一次干净 Gitea Runner 执行记录作为关闭证据；
- P1-9 明确保留人工批准：CI 只生成候选产物和 draft 元数据，稳定渠道不得无人值守自动提升。

### 5.3 P2

- 连接中状态被显示为“Core 已断开”；
- 截图后端读取失败时设置页可能永久 loading；
- React 没有用户可见 Error Boundary，bootstrap 兜底又缺少 Chakra/i18n Provider；
- 多个可点击 `div` 缺少键盘操作和正确语义；
- 部分 Simple E2E 仍使用旧品牌名称、中文文本和已经变化的 DOM；
- 设置、会员、反馈和高级入口仍有超出 MVP 的半接线能力。
- 内网签名服务当前可继续使用，但正式对外发布前必须增加 HTTPS、身份认证、来源限制和审计日志；PR/普通 CI 始终禁止调用正式签名服务。

## 6. 三层自动化门禁

### 6.1 PR 必过：快速、无真实硬件、无正式签名

目标时长：5～10 分钟。作为合并到受保护分支的 Required Check。

最小命令集：

```powershell
cargo clippy --manifest-path core/Cargo.toml --all-targets --all-features -- -D warnings
cargo test --manifest-path core/Cargo.toml

npm ci --prefix simple
npm test --prefix simple
npm run build --prefix simple
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-simple-release-assets.ps1
cargo test -p skydimo-simple --all-targets
cargo clippy -p skydimo-simple --all-targets -- -D warnings
```

在此基础上必须增加：

1. Simple transport/hook 单元测试，使用可注入的 Mock WebSocket/Core；
2. JSON-RPC DTO/协议契约测试；
3. Simple 专属 Playwright project；
4. 空状态、发现设备、开关、亮度、灯效、断开重连、写入失败和配置保存；
5. 插件 lock/allowlist 校验；
6. 构建未签名 NSIS，验证包内容；
7. 测试崩溃、进程退出或持续拒连必须 FAIL，不得转成 SKIP。

PR 门禁不得：

- 要求真实 USB 设备；
- 调用正式代码签名服务；
- 构建或签名 Advanced 后才允许 Simple 通过；
- 依赖测试 Runner 中已经存在的子模块或二进制。

### 6.2 Nightly：干净 Windows VM

Nightly 必须下载 PR/主分支同一 SHA 的候选产物，而不是重新拼装不同版本：

1. 真正静默安装 Simple；
2. 首次启动并验证安装后的 Simple/Core/profile 握手；
3. 使用虚拟设备执行完整 RPC 和 UI 回归；
4. Core kill → UI 显示断开 → Core 重启 → 自动恢复；
5. `N-1 → N` 覆盖升级并保留配置；
6. 自启动、关闭行为、托盘和系统重启；
7. 卸载、重装和配置保留/清理策略；
8. 上传安装日志、UI/Core 日志、截图、JUnit 和产物 SHA。

### 6.3 RC/正式发布：最终二进制 + 硬件实验室

RC 必须测试最终将被发布的同一组二进制：

1. 受保护入口验证 tag/版本与产品提交一致；
2. 验证相同 SHA 的 PR 与 Nightly 已通过；
3. 构建一次、签名一次，测试后不得重新构建；
4. 验证 Authenticode、可信时间戳、Defender、SHA256 和精确包内容；
5. 每个支持的设备 SKU/固件至少完成 100 次 USB 插拔/掉电恢复；
6. 完成 24 小时 soak，以及休眠/唤醒、重启和 Core 崩溃恢复；
7. 完成安装、`N-1 → N` 升级和回滚演练；
8. 先生成 draft/prerelease，保留一次人工批准；
9. 批准后提升已测试产物，并更新 Simple stable/RC 渠道元数据；
10. 更新服务必须支持暂停和撤回版本。

## 7. 物理 USB 与欠压测试

物理测试可以无人值守，但需要独立硬件 Runner，软件模拟不能替代：

```text
Gitea Hardware Job
  → 可编程 USB Hub：数据连接/断开
  → USB 继电器：硬掉电
  → 可编程电源：电压下降、限流和恢复
  → Windows Simple/Core：发现、恢复、配置和灯效验证
  → JSON/JUnit 报告 + 电压/电流/时序 + 日志
```

硬件任务至少记录：

- 候选安装包和 Core SHA；
- Hub、继电器、电源型号；
- 设备 SKU、序列号和固件；
- 断开、重新枚举和恢复可控制的耗时；
- 电压、电流、错误次数和每轮结果；
- 失败时的 UI/Core 日志与设备管理器状态。

现有 G857D smoke/regression 可以作为恢复后的功能断言，但必须先做到：

- 普通断言失败返回非零退出码；
- workflow 使用独立 Runner 标签，例如 `windows-simple-hw-g857d`；
- 报告 JSON 是 RC job 的必需 artifact；
- 日常执行约 20 轮，RC 对每个支持 SKU 执行至少 100 轮。

## 8. 现有测试体系需要先修复的问题

### 8.1 `Skydimo-3.0-UI-Tests`

- `.gitmodules` 只声明 `Skydimo`，索引中还存在未映射的 `Skydimo3x-UI` gitlink；
- 两个产品目录当前为空并固定在旧提交；
- Simple runner 默认仍寻找 `VIB.exe` / `VIBCore.exe`；
- Playwright `full` 混跑 Advanced 和 Simple，`smoke` 实际不包含 Simple；
- Logo 和设置页用例已经与当前 DOM/功能漂移；
- WebView2 崩溃或持续拒连可能被记为 SKIP；
- 断连压力测试默认关闭，且不能证明 Core kill/restart 后恢复。

修复后，Simple 应拥有独立 project、稳定的 `data-testid` 和明确的外部产物参数。

### 8.2 `core-Tests`

- 默认 `addopts` 忽略 `test_core_recovery.py` 与 `test_persistence.py`；
- 常用 full runner 使用外部 Core 并跳过 loop；
- 默认可执行文件名和目录仍是旧值；
- 最新保存报告没有产品 Git SHA，且不能代表当前版本；
- 62 个 Simple RPC 中仍有约 22 个没有直接覆盖，优先补 LED 编辑会话、设备设置、快捷键、遥测异常、会员、插件下载和全设备电源。

恢复、持久化必须成为显式的非外部 Core 门禁，而不是默认忽略项。

## 9. 回滚原则

1. 永久保留当前稳定版和上一稳定版安装包、SHA 与签名信息；
2. 升级前原子备份整个应用配置目录，并记录来源版本/schema；
3. 每次 schema 变化都增加 `N-1 → N` 和恢复 `N-1` 快照的测试；
4. RC 可以卸载候选、恢复旧安装包和旧配置快照；
5. 生产事故优先暂停更新渠道，然后发布“更高版本号、代码回退”的热修复；
6. 不让普通用户直接用旧 Core 打开已经由新 schema 写入的配置；
7. Git 使用 revert 撤销问题变更，不重写共享分支历史。

## 10. 实施顺序

### S0：立即保护用户数据和启动可见性

- 将 Simple 的入口和 RPC 收敛为“仅设置能力驱动的线性灯珠数”，固定/复杂布局完全只读；
- 为 Core 启动失败提供可见故障页、重试和日志入口；
- 为前端增加 Error Boundary 和 provider 完整的 bootstrap 兜底。

### S1：让自动化结果可信

- 三个仓库绑定同一产品 SHA；
- 修复测试仓库 gitlink、二进制名称和 Playwright project；
- 把崩溃转 SKIP 改为 FAIL；
- 将 Simple Tauri 33 项测试、Simple UI 26 项测试和 Core persistence/recovery 纳入默认门禁；
- 为 transport、断连恢复和控制失败回滚增加自动测试。

### S2：修复 Simple 核心状态一致性

- 禁止断连后误切其他设备；
- Core 重启后重新连接、订阅并刷新权威快照；
- 控制失败时回滚 UI 并允许重试；
- 修复强制更新缺 URL/打开失败的锁死路径。

### S3：拆出 Simple 独立 CI 与发布线

- 建立 `simple-ci` required check；
- 建立插件 lock/allowlist；
- 初始化打包所需子模块；
- 从 Release 中移除 Advanced 阻断；
- 建立受保护签名和更新渠道发布步骤。

### S4：建立 VM 与硬件实验室

- 真正安装、升级、卸载候选安装包；
- 接入 USB Hub、继电器和可编程电源；
- 将物理恢复、休眠/唤醒和 soak 报告作为 RC 门禁。

### S5：发布第一个 Simple 稳定版

- 所有 P0/P1 清零；
- PR、Nightly、硬件和 RC 门禁测试同一组二进制；
- 完成回滚演练；
- 人工批准后仅提升已经测试通过的产物。

## 11. 稳定版完成定义

只有同时满足以下条件，Simple 才能标记为“普通用户稳定版”：

- P0 = 0，P1 = 0；
- Simple 独立流水线不依赖 Advanced 成功；
- 关键用户路径均有自动化，崩溃不能被记为跳过；
- 干净安装、覆盖升级、卸载和配置恢复全部通过；
- 每个支持 SKU/固件至少 100 次物理恢复通过；
- 24 小时 soak 无未恢复断连、配置破坏或不可控设备；
- 最终产物已验签、带可信时间戳、哈希和精确插件清单；
- 更新渠道发布和暂停/撤回能力已经演练；
- 发布报告能追溯产品、测试和产物 SHA。

相关长期规划参见 [更新、Feature Flag 与资源交付路线分析](./update-and-feature-delivery-roadmap.md)。

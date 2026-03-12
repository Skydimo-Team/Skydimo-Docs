---
sidebar_position: 2
---

# 快速入门

本指南将带你创建第一个 Skydimo 插件 —— 一个简单的颜色循环灯效。

## 前提条件

- 已安装并运行 Skydimo
- 文本编辑器
- 基础 Lua 知识（[Lua 5.4 参考手册](https://www.lua.org/manual/5.4/)）

## 第一步：创建插件目录

在 `plugins/` 目录下创建一个文件夹：

```
plugins/effect.my_first_effect/
```

目录名必须遵循 `<type>.<id>` 格式，其中：
- `type` 为 `controller`、`effect` 或 `extension`
- `id` 为使用小写字母、数字和下划线组成的唯一标识符

## 第二步：编写 manifest.json

创建 `plugins/effect.my_first_effect/manifest.json`：

```json
{
  "id": "my_first_effect",
  "version": "1.0.0",
  "name": "My First Effect",
  "type": "effect",
  "language": "lua",
  "entry": "main.lua",
  "category": "animation",
  "icon": "Sparkles",
  "permissions": ["log"],
  "params": [
    {
      "key": "speed",
      "label": "Speed",
      "kind": "slider",
      "default": 1.0,
      "min": 0.1,
      "max": 5.0,
      "step": 0.1
    },
    {
      "key": "color",
      "label": "Color",
      "kind": "color",
      "default": "#FF6600"
    }
  ]
}
```

## 第三步：编写 main.lua

创建 `plugins/effect.my_first_effect/main.lua`：

```lua
local plugin = {}

-- 参数（由 on_params 更新）
local speed = 1.0
local base_r, base_g, base_b = 255, 102, 0

function plugin.on_init()
    -- 灯效实例化时调用一次
end

function plugin.on_params(p)
    -- 用户更改参数时调用
    if p.speed then
        speed = p.speed
    end
    if p.color then
        -- 颜色以 {r, g, b} 表格形式传入
        base_r = p.color[1] or base_r
        base_g = p.color[2] or base_g
        base_b = p.color[3] or base_b
    end
end

function plugin.on_tick(elapsed, buffer, width, height)
    local count = buffer:len()

    for i = 1, count do
        -- 根据位置和时间计算波形
        local ratio = (i - 1) / count
        local wave = math.sin((ratio + elapsed * speed) * math.pi * 2)
        local brightness = (wave + 1) / 2  -- 归一化至 0..1

        local r = math.floor(base_r * brightness)
        local g = math.floor(base_g * brightness)
        local b = math.floor(base_b * brightness)
        buffer:set(i, r, g, b)
    end
end

function plugin.on_shutdown()
    -- 灯效移除时调用
end

return plugin
```

## 第四步：测试插件

1. 重启 Skydimo Core（或触发插件重新扫描）
2. 在 UI 中选择任意设备
3. 在灯效列表中找到"My First Effect"
4. 调整速度和颜色参数

## 下一步

- [Manifest 参考](manifest) —— 所有 manifest 选项
- [灯效插件指南](effect-plugin) —— 高级灯效技巧
- [控制器插件指南](controller-plugin) —— 编写硬件驱动
- [扩展插件指南](extension-plugin) —— 构建后台服务

## 故障排查

:::tip
查看 Core 日志输出以获取 Lua 错误信息。插件错误日志会带有插件 ID 前缀。
:::

常见问题：
- **插件未显示**：确认目录名匹配 `effect.<id>` 格式，且 `manifest.json` 是有效 JSON
- **Lua 错误**：确保入口文件返回包含预期回调函数的表
- **参数不生效**：确认 `manifest.json` 中 `params` 的 key 与 `on_params` 中读取的 key 一致

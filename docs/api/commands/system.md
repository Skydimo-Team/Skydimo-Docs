---
sidebar_position: 6
---

# System Commands

Commands for system information and global configuration.

## get_system_info

Returns information about the host system.

**Parameters**: none

```json
→ {"jsonrpc":"2.0","method":"get_system_info","id":1}
← {"jsonrpc":"2.0","result":{
  "os_platform": "windows",
  "os_version": "10.0.22631",
  "os_build": "22631",
  "arch": "x86_64"
},"id":1}
```

# 🚀 Installation Guide

## Step 1: Build the Project

```bash
cd /Users/zoharazriel/Documents/code-quality-mcp
npm install
npm run build
```

## Step 2: Configure Claude Desktop

### Find your config file location:

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Add this configuration:

**Option 1: If file doesn't exist, create it:**

```json
{
  "mcpServers": {
    "code-quality": {
      "command": "node",
      "args": ["/Users/zoharazriel/Documents/code-quality-mcp/dist/index.js"]
    }
  }
}
```

**Option 2: If file exists, add to existing mcpServers:**

```json
{
  "mcpServers": {
    "existing-server": {
      ...
    },
    "code-quality": {
      "command": "node",
      "args": ["/Users/zoharazriel/Documents/code-quality-mcp/dist/index.js"]
    }
  }
}
```

⚠️ **Important:** Update the path `/Users/zoharazriel/Documents/code-quality-mcp/dist/index.js` to match your actual project location!

## Step 3: Restart Claude Desktop

1. **Completely quit Claude Desktop**
   - Mac: `Cmd + Q`
   - Windows/Linux: Exit from taskbar

2. **Start Claude Desktop again**

## Step 4: Verify Installation

Ask Claude:

```
What MCP tools do I have?
```

You should see:
- ✅ analyze_project
- ✅ check_quality
- ✅ get_smart_summary
- ✅ get_quick_wins
- ✅ get_trends
- ✅ get_recommendations

## 🔄 After Making Changes

Whenever you update the code:

```bash
npm run build
```

Then **restart Claude Desktop** (Cmd/Ctrl + Q and reopen).

## 🐛 Troubleshooting

### Issue: Tools not showing up

1. **Check logs in Claude Desktop:**
   - Open Developer Tools: `Cmd/Ctrl + Option/Shift + I`
   - Look for MCP-related errors in Console

2. **Verify config path:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Test MCP directly:**
   ```bash
   node /Users/zoharazriel/Documents/code-quality-mcp/dist/index.js
   ```

   Should output:
   ```
   Code Quality MCP Server running...
   ```

### Issue: "Cannot find module" error

- Make sure you ran `npm run build`
- Check that `dist/index.js` exists
- Verify the path in config is absolute (not relative)

### Issue: Old version still running

1. Quit Claude Desktop completely
2. Rebuild: `npm run build`
3. Restart Claude Desktop

---

## 📝 Quick Reference

```bash
# Install dependencies
npm install

# Build project
npm run build

# Test locally
npm start

# Location to update after changes
~/Library/Application Support/Claude/claude_desktop_config.json
```

---

## ✨ Next Steps

Once installed, check out:
- **[HOW_TO_USE.md](./HOW_TO_USE.md)** - Learn how to use the tools
- **[README.md](./README.md)** - Full documentation

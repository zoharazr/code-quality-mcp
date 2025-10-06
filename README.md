# 🚀 Code Quality MCP Server

> **Hybrid Code Quality Analysis** - Combines logic-based checks with AI-powered deep analysis

MCP (Model Context Protocol) system for code quality analysis. Supports two modes:
- ⚡ **Fast Mode**: Quick logic-based checks
- 🤖 **Deep Mode**: AI-powered deep analysis (Claude)

---

## 🔧 Installation

```bash
npm install
npm run build
```

## ▶️ Running the Server

### Option 1: Direct Run
```bash
npm start
```

### Option 2: Via Claude Desktop

Add to `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "code-quality": {
      "command": "node",
      "args": ["/absolute/path/to/code-quality-mcp/dist/index.js"]
    }
  }
}
```

---

## 📚 API Tools

### 🔍 Analysis Tools

#### 1. `check_quality` - Full Code Quality Check

```typescript
{
  "tool": "check_quality",
  "arguments": {
    "projectPath": ".",
    "deepAnalysis": false,     // true = AI mode
    "checkUnusedCode": true,
    "checkComplexity": false,  // requires AI
    "checkSecurity": false,    // requires AI
    "page": 1,                 // pagination
    "pageSize": 50             // items per page
  }
}
```

**Returns:** Complete list of issues with pagination

---

### 💡 Smart Tools (Recommended!)

#### 2. `get_smart_summary` - Smart Summary ⭐

Instead of 500 issues, get a focused summary:

```typescript
{
  "tool": "get_smart_summary",
  "arguments": {
    "projectPath": "."
  }
}
```

**Returns:**
```
📊 Score: 68/100
📈 Issues: 500 (120 critical)
⏱️ Fix Time: 2 days

🔥 Top Problems:
  • unused-code: 300 (60%)
  • security: 50 (10%)

📁 Hotspot Files:
  🔴 UserService.ts - 45 issues
```

---

#### 3. `get_quick_wins` - Quick Wins ⚡

Get only actions that provide maximum impact in minimum time:

```typescript
{
  "tool": "get_quick_wins",
  "arguments": {
    "projectPath": "."
  }
}
```

**Returns:**
```
⚡ Quick Wins:
1. Remove 50 unused vars (10 min) → +15 points
2. Fix 30 console.log (5 min) → +8 points
3. Translate Hebrew comments (15 min) → +5 points

Total: 30 minutes → +28 points!
```

---

#### 4. `get_trends` - Progress Tracking 📈

See how code quality improves over time:

```typescript
{
  "tool": "get_trends",
  "arguments": {
    "projectPath": "."
  }
}
```

**Returns:**
```
📈 Trends:
  ✅ Score: 45 → 68 (+23)
  ✅ Fixed: 120 issues
  ⚠️ New: 15 issues

Improving:
  • unused-code: 300 → 180 (-120)
  • security: 10 → 5 (-5)

Degrading:
  • code-style: 50 → 65 (+15)
```

---

### 🔧 Other Tools

#### 5. `analyze_project` - Project Type Detection

```typescript
{
  "tool": "analyze_project",
  "arguments": {
    "projectPath": ".",
    "deep": true
  }
}
```

#### 6. `get_recommendations` - Quick Recommendations

```typescript
{
  "tool": "get_recommendations",
  "arguments": {
    "projectPath": ".",
    "language": "en"  // or "he" for Hebrew
  }
}
```

---

## ⚡ Fast vs Deep Mode

| Feature | Fast Mode | Deep Mode |
|---------|-----------|-----------|
| Speed | ~20ms | ~1000ms |
| Cost | Free | API calls |
| Accuracy | Good | Excellent |
| AI insights | ❌ | ✅ |

**When to use Fast Mode:**
- During development
- Before commits
- In CI/CD pipelines

**When to use Deep Mode:**
- Before Pull Requests
- Code reviews
- Security audits

---

## 📖 Examples

- **[HOW_TO_USE.md](./HOW_TO_USE.md)** - 🎯 How to use this MCP in Claude (commands, examples)
- **[examples/usage-examples.ts](./examples/usage-examples.ts)** - Complete API examples

---

## 🌍 Supported Platforms

- Node.js / TypeScript
- React / React Native
- Next.js / NestJS
- Firebase / AWS Amplify
- Java / .NET / Angular

---

## 🚀 Key Features

✅ **Smart Ignore Patterns** - Automatically skips:
  - `node_modules`, `build`, `dist`, `.git`
  - React Native: `android/gradle`, `ios/Pods`, native build folders
  - Only scans **your code**, not auto-generated files

✅ **Pagination** - Handle large projects with many issues

✅ **Smart Summaries** - Get actionable insights instead of overwhelming lists

✅ **Quick Wins** - Find high-impact, low-effort fixes

✅ **Trend Tracking** - Monitor code quality improvements over time

---

**Built with ❤️ using MCP and Claude**

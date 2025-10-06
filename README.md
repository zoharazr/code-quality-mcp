# 🚀 Code Quality MCP Server

> **Hybrid Code Quality Analysis** - Combines logic-based checks with AI-powered deep analysis

מערכת MCP (Model Context Protocol) לבדיקת איכות קוד. תומכת בשני מצבים:
- ⚡ **Fast Mode**: בדיקות מהירות מבוססות לוגיקה  
- 🤖 **Deep Mode**: ניתוח מעמיק מבוסס AI (Claude)

---

## 🔧 התקנה

```bash
npm install
npm run build
```

## ▶️ הפעלת השרת

### אופציה 1: הרצה ישירה
```bash
npm start
```

### אופציה 2: דרך Claude Desktop

הוסף ל-`~/.config/Claude/claude_desktop_config.json`:

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

### 1. `check_quality` - בדיקת איכות קוד

```typescript
{
  "tool": "check_quality",
  "arguments": {
    "projectPath": ".",
    "deepAnalysis": false,     // true = AI mode
    "checkUnusedCode": true,
    "checkComplexity": false,  // requires AI
    "checkSecurity": false     // requires AI
  }
}
```

### 2. `analyze_project` - זיהוי סוג פרויקט

```typescript
{
  "tool": "analyze_project",
  "arguments": {
    "projectPath": ".",
    "deep": true
  }
}
```

### 3. `get_recommendations` - המלצות מהירות

```typescript
{
  "tool": "get_recommendations",
  "arguments": {
    "projectPath": ".",
    "language": "he"
  }
}
```

---

## ⚡ Fast vs Deep Mode

| Feature | Fast Mode | Deep Mode |
|---------|-----------|-----------|
| מהירות | ~20ms | ~1000ms |
| עלות | חינם | API calls |
| דיוק | טוב | מצוין |
| AI insights | ❌ | ✅ |

**Fast Mode - מתי להשתמש:**
- בזמן פיתוח
- לפני commit
- ב-CI/CD

**Deep Mode - מתי להשתמש:**
- לפני PR
- code review
- ביקורת אבטחה

---

## 📖 דוגמאות

ראה [examples/usage-examples.ts](./examples/usage-examples.ts) לדוגמאות מלאות

---

## 🌍 תמיכה

- Node.js / TypeScript
- React / React Native
- Next.js / NestJS
- Firebase / AWS Amplify
- Java / .NET / Angular

**Built with ❤️ using MCP and Claude**

# 🎯 How to Use This MCP in Claude

## 📋 Quick Commands to Try

Once the MCP is installed in Claude Desktop, you can ask Claude:

### 1️⃣ Discover Available Tools

```
What MCP tools do I have available?
```

or

```
List all the code-quality tools
```

### 2️⃣ Get Smart Summary

```
Use the code-quality MCP to get a smart summary of this project
```

or

```
Run get_smart_summary on /path/to/my/project
```

**You'll get:**
- Overall score (0-100)
- Total issues and critical count
- Top 5 problem categories
- Top 5 hotspot files
- Estimated fix time

### 3️⃣ Get Quick Wins

```
Show me quick wins for improving code quality
```

or

```
What are the easiest fixes I can make right now?
```

**You'll get:**
- High-impact, low-effort fixes
- Estimated time for each fix
- Score improvement potential
- ROI-sorted list

### 4️⃣ See Trends

```
How has my code quality changed over time?
```

or

```
Show me code quality trends
```

**You'll get:**
- Score comparison (before → after)
- Issue count changes
- Improving areas ✅
- Degrading areas ❌

### 5️⃣ Full Analysis

```
Check the code quality of this project with pagination
```

or

```
Run a full code quality check and show me page 1
```

**You'll get:**
- Paginated list of all issues
- Issues by severity (error/warning/info)
- Issues by category
- File locations and line numbers

### 6️⃣ Analyze Project Type

```
What type of project is this?
```

or

```
Detect the project types in this codebase
```

**You'll get:**
- Detected frameworks (React, Next.js, etc.)
- Project structure analysis
- Multi-project detection

---

## 💬 Example Conversations

### Scenario 1: First-time Analysis

**You:** "Analyze the code quality of my project"

**Claude:** *Uses check_quality tool*

**You:** "That's a lot of issues! What should I fix first?"

**Claude:** *Uses get_quick_wins tool and shows top 3 easy fixes*

**You:** "Great! I'll fix those. Can you track my progress?"

**Claude:** *Uses get_trends to show improvement over time*

---

### Scenario 2: Deep Dive

**You:** "Give me a high-level overview of code quality"

**Claude:** *Uses get_smart_summary*

**You:** "Show me the UserService.ts file issues"

**Claude:** *Uses check_quality with pagination and filters for that file*

---

### Scenario 3: Continuous Improvement

**You:** "How am I doing compared to last week?"

**Claude:** *Uses get_trends*

**You:** "Nice! What are my next quick wins?"

**Claude:** *Uses get_quick_wins*

---

## 🔧 Direct Tool Invocations

You can also ask Claude to use specific tools:

### Smart Summary
```
Use get_smart_summary on this project
```

### Quick Wins
```
Use get_quick_wins to find easy improvements
```

### Trends
```
Use get_trends to see my progress
```

### Full Check (with options)
```
Use check_quality with:
- Deep analysis enabled
- Check security issues
- Page 2 of results
```

### Project Analysis
```
Use analyze_project to detect framework types
```

---

## 🎨 Pro Tips

### Tip 1: Be Specific
❌ "Check my code"
✅ "Get a smart summary of code quality for /Users/me/myproject"

### Tip 2: Iterate
1. Start with `get_smart_summary` (overview)
2. Then `get_quick_wins` (actionable items)
3. Fix issues
4. Use `get_trends` (see improvement)

### Tip 3: Use Natural Language
Claude understands context! You can say:
- "What's wrong with my code?"
- "How can I improve this project?"
- "Show me the easiest bugs to fix"
- "Am I getting better over time?"

### Tip 4: Filter Results
- "Show me only security issues"
- "What are the critical errors?"
- "Which files have the most problems?"

---

## 🚀 Available Tools Summary

| Tool | Purpose | Use When |
|------|---------|----------|
| `get_smart_summary` | High-level overview | First check, quick status |
| `get_quick_wins` | Easy high-impact fixes | Want to improve fast |
| `get_trends` | Track progress | After making changes |
| `check_quality` | Full detailed analysis | Need complete list |
| `analyze_project` | Detect project type | Understanding structure |
| `get_recommendations` | Quick tips | Need guidance |

---

## 📝 Note

The MCP automatically:
- ✅ Skips `node_modules`, `build`, `dist`
- ✅ Ignores React Native native builds
- ✅ Saves analysis history for trends
- ✅ Provides pagination for large projects

Just ask Claude naturally, and it will use the right tool!

# 🚀 L.O.I Flask Web UI

## Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Flask Server
```bash
python app.py
```

You'll see:
```
🚀 L.O.I chatbot is running!
📱 Open browser: http://localhost:5000
```

### 3. Open in Browser
Go to: **http://localhost:5000**

---

## Project Structure

```
tapl;am chatbot/
├── app.py                 # Flask backend
├── main.py               # Original CLI chatbot
├── requirements.txt      # Python dependencies
├── system_prompt.txt     # Bot personality
├── chat_history.json     # Auto-saved conversations
├── templates/
│   └── index.html        # HTML template
└── static/
    ├── style.css         # Styling
    └── script.js         # Frontend logic
```

---

## Features

✅ Beautiful web interface  
✅ Real-time chat  
✅ Auto-save conversation history  
✅ Clear history button  
✅ Responsive design (works on mobile)  
✅ Typing indicator  
✅ Smooth animations  

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main chat page |
| POST | `/api/chat` | Send a message |
| GET | `/api/bot-name` | Get bot name |
| POST | `/api/clear-history` | Clear all conversations |

---

## Customization

### Change Port
```bash
# Edit app.py, change line:
app.run(debug=True, host='0.0.0.0', port=8000)
```

### Change Colors
Edit `/static/style.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... add more colors ... */
}
```

### Change Bot Name
Edit `/system_prompt.txt`:
```
Bạn là "YOUR_BOT_NAME"
...
```

---

## Troubleshooting

**❌ ModuleNotFoundError: No module named 'flask'**
```bash
pip install -r requirements.txt
```

**❌ Port 5000 already in use**
```bash
python app.py  # Change port in app.py
```

**❌ GEMINI_API_KEY not found**
- Create `.env` file with: `GEMINI_API_KEY=your_key_here`

**❌ Messages not sending**
- Check terminal for errors
- Press F12 in browser to check console
- Make sure backend is running

---

## Running Both CLI and Web UI

**Terminal 1 - Web UI:**
```bash
python app.py
```

**Terminal 2 - CLI (Optional):**
```bash
python main.py
```

---

**Enjoy your Flask chatbot! 🎉**

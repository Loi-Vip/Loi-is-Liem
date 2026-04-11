import os
import sys
import warnings
from io import StringIO
import json
from pathlib import Path
from collections import defaultdict
from threading import Thread

# Suppress deprecation warnings
warnings.filterwarnings('ignore')
old_stderr = sys.stderr
sys.stderr = StringIO()
import google.generativeai as genai
sys.stderr = old_stderr

from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

# Load environment variables
load_dotenv()

# Setup Flask
app = Flask(__name__)
CORS(app)

# Setup Gemini API
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=api_key)

# Load system prompts
prompt_path = os.path.join(os.path.dirname(__file__), 'system_prompt.txt')
with open(prompt_path, 'r', encoding='utf-8') as f:
    system_prompt = f.read().strip()

prompt_path_polite = os.path.join(os.path.dirname(__file__), 'system_prompt_polite.txt')
try:
    with open(prompt_path_polite, 'r', encoding='utf-8') as f:
        system_prompt_polite = f.read().strip()
except:
    system_prompt_polite = system_prompt

# Extract bot name
bot_name = "L.O.I"
if '"' in system_prompt:
    try:
        start = system_prompt.find('"') + 1
        end = system_prompt.find('"', start)
        bot_name = system_prompt[start:end]
    except:
        pass

# Style tracking
current_style = 1
chat_history_style1 = []
chat_history_style2 = []
question_count = defaultdict(int)
HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'chat_history.json')

# Create models for each style
model_style1 = genai.GenerativeModel(
    'gemini-3-flash-preview',
    system_instruction=system_prompt
)
model_style2 = genai.GenerativeModel(
    'gemini-3-flash-preview',
    system_instruction=system_prompt_polite
)
model = model_style1  # Default


def normalize_question(text):
    """Normalize question for comparison"""
    return text.strip().lower()


def load_chat_history():
    """Load chat history from file"""
    global chat_history_style1, chat_history_style2
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                chat_history_style1 = data.get("style1", [])
                chat_history_style2 = data.get("style2", [])
    except Exception as e:
        print(f"Error loading history: {e}")


def save_chat_history():
    """Save chat history to file"""
    try:
        data = {
            "style1": chat_history_style1,
            "style2": chat_history_style2
        }
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")


def get_irritability_message(question_text):
    """Get message about repetition count"""
    normalized = normalize_question(question_text)
    count = question_count[normalized]
    
    if count == 0:
        return None
    elif count == 1:
        return "[Đây là lần thứ 2 hỏi câu này]"
    elif count == 2:
        return "[Đây là lần thứ 3 hỏi câu này - HỎI ĐI HỎI LẠI RỒI!]"
    else:
        return f"[Đây là lần thứ {count + 1} hỏi câu này - MỰC CHỪNG GÌ CHI?]"


def chat_with_gemini(user_message):
    """Send message to Gemini and get response"""
    try:
        global current_style
        
        # Get appropriate history for current style
        chat_history = chat_history_style1 if current_style == 1 else chat_history_style2
        current_model = model_style1 if current_style == 1 else model_style2
        
        normalized_question = normalize_question(user_message)
        irritability_msg = get_irritability_message(user_message)
        question_count[normalized_question] += 1
        
        if irritability_msg:
            full_message = f"{irritability_msg}\n\n{user_message}"
        else:
            full_message = user_message
        
        chat = current_model.start_chat(history=chat_history)
        response = chat.send_message(full_message)
        bot_response = response.text
        
        # Add to appropriate history
        chat_history.append({
            "role": "user",
            "parts": [full_message]
        })
        chat_history.append({
            "role": "model",
            "parts": [bot_response]
        })
        
        # Update global history
        if current_style == 1:
            chat_history_style1[:] = chat_history
        else:
            chat_history_style2[:] = chat_history
        
        # Save history
        save_chat_history()
        
        return bot_response
    except Exception as e:
        return f"Error: {str(e)}"


# Routes
@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html', bot_name=bot_name)


@app.route('/api/chat', methods=['POST'])
def send_message():
    """Handle chat messages"""
    data = request.get_json()
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    response = chat_with_gemini(message)
    return jsonify({'message': response, 'bot_name': bot_name})


@app.route('/api/bot-name', methods=['GET'])
def get_bot_name():
    """Get bot name"""
    return jsonify({'bot_name': bot_name})


@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    """Clear chat history"""
    global chat_history_style1, chat_history_style2, question_count
    chat_history_style1 = []
    chat_history_style2 = []
    question_count = defaultdict(int)
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)
    return jsonify({'status': 'History cleared'})


@app.route('/api/change-style', methods=['POST'])
def change_style():
    """Change chatbot style"""
    global current_style, model
    data = request.get_json()
    new_style = data.get('style', 1)
    
    if new_style not in [1, 2]:
        return jsonify({'error': 'Invalid style'}), 400
    
    current_style = new_style
    model = model_style1 if new_style == 1 else model_style2
    
    return jsonify({'style': current_style, 'status': 'Style changed'})


@app.route('/api/get-style', methods=['GET'])
def get_style():
    """Get current chatbot style"""
    style_names = {1: "Nham Hiểm", 2: "Lịch Sự"}
    style_name = style_names.get(current_style, "Unknown")
    return jsonify({'style': current_style, 'style_name': style_name})


if __name__ == '__main__':
    # Load initial history
    load_chat_history()
    
    # Run Flask app
    print(f"\n🚀 {bot_name} chatbot is running!")
    print("📱 Open browser: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

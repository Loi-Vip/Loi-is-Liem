import os
import sys
import warnings
from io import StringIO
import json

# Suppress deprecation warnings BEFORE importing google.generativeai
warnings.filterwarnings('ignore')

# Redirect stderr temporarily to suppress the deprecation message during import
old_stderr = sys.stderr
sys.stderr = StringIO()

import google.generativeai as genai

# Restore stderr
sys.stderr = old_stderr

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Conversation history storage
HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'chat_history.json')

# Setup Gemini API
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

genai.configure(api_key=api_key)

# Get model name from .env, default to gemini-2-0-flash
MODEL_NAME = os.getenv('MODEL_NAME', 'gemini-2-0-flash')

# Load system prompt from file
prompt_path = os.path.join(os.path.dirname(__file__), 'system_prompt.txt')
with open(prompt_path, 'r.', encoding='utf-8') as f:
    system_prompt = f.read().strip()

# Extract bot name from system prompt (assumes format: 'Bạn là "NAME"')
bot_name = "L.O.I"
if '"' in system_prompt:
    try:
        start = system_prompt.find('"') + 1
        end = system_prompt.find('"', start)
        bot_name = system_prompt[start:end]
    except:
        pass

# Create model instance
model = genai.GenerativeModel(
    MODEL_NAME,
    system_instruction=system_prompt
)

# Initialize conversation history
chat_history = []

# Track repeated questions
from collections import defaultdict
question_count = defaultdict(int)


def load_chat_history():
    """Load chat history from file if it exists"""
    global chat_history
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                chat_history = data.get("conversation", [])
                if chat_history:
                    print(f"✅ Đã tải lại {len(chat_history)//2} cuộc hội thoại trước đó\n")
    except Exception as e:
        print(f"⚠️ Lỗi tải lịch sử: {e}\n")


def save_chat_history():
    """Save chat history to file"""
    try:
        data = {"conversation": chat_history}
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Lỗi lưu lịch sử: {e}")


def delete_chat_history():
    """Delete chat history file"""
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
            print("Tao tự xóa trí nhớ rồi nhé thằng ngu, hẹn không gặp lại")
    except Exception as e:
        print(f"⚠️ Lỗi xóa lịch sử: {e}")


def normalize_question(text):
    """Normalize question for comparison (case-insensitive, trim)"""
    return text.strip().lower()


def get_irritability_message(question_text):
    """Get message about repetition count"""
    normalized = normalize_question(question_text)
    count = question_count[normalized]
    
    if count == 0:
        return None  # First time
    elif count == 1:
        return "[Đây là lần thứ 2 hỏi câu này]"
    elif count == 2:
        return "[Đây là lần thứ 3 hỏi câu này - HỎI ĐI HỎI LẠI RỒI!]"
    else:
        return f"[Đây là lần thứ {count + 1} hỏi câu này - MỰC CHỪNG GÌ CHI?]"


# Function to send message to Gemini
def chat_with_gemini(user_message):
    """Send message to Gemini and get response"""
    try:
        # Track question repetition
        normalized_question = normalize_question(user_message)
        irritability_msg = get_irritability_message(user_message)
        question_count[normalized_question] += 1
        
        # Prepare message with irritability info if it's a repeat
        if irritability_msg:
            full_message = f"{irritability_msg}\n\n{user_message}"
        else:
            full_message = user_message
        
        # Start chat session with history
        chat = model.start_chat(history=chat_history)
        
        # Send message and get response
        response = chat.send_message(full_message)
        bot_response = response.text
        
        # Add messages to history
        chat_history.append({
            "role": "user",
            "parts": [full_message]
        })
        chat_history.append({
            "role": "model",
            "parts": [bot_response]
        })
        
        return bot_response
    except Exception as e:
        return f"❌ Lỗi: {str(e)}"


# Main chat loop
print("\n--- Bot đã khởi động ---\n")

# Load previous conversation history
load_chat_history()

while True:
    user_input = input("Bạn: ").strip()
    
    if not user_input:
        continue
    
    if user_input.lower() in ['thoát', 'exit', 'dừng', 'cút đi']:
        delete_chat_history()  # Delete history before exit
        print(f"{bot_name}: Tạm biệt! T sủi đây.")
        break
    
    response = chat_with_gemini(user_input)
    print(f"{bot_name}: {response}\n")
    save_chat_history()  # Save after each message

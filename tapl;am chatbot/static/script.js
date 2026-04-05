const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.querySelector('.send-btn');

// Remove welcome message when first real message is added
let welcomeRemoved = false;

// Go to premium link
function goToPremium() {
    window.open('https://upload.wikimedia.org/wikipedia/commons/9/9c/Middle_finger_BNC.jpg', '_blank');
}

// Premium modal functions
function showPremiumModal() {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.style.display = 'flex';
    }
}

function closePremiumModal() {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.style.display = 'none';
    }
}

// Send message function
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Remove welcome message on first message
    if (!welcomeRemoved) {
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
            welcomeRemoved = true;
        }
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.focus();
    
    // Disable send button
    sendBtn.disabled = true;
    sendBtn.classList.add('loading');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response to chat
        addMessage(data.message, 'bot');
        
    } catch (error) {
        removeTypingIndicator();
        addMessage('Sorry, there was an error. Please try again.', 'bot');
        console.error('Error:', error);
    } finally {
        sendBtn.disabled = false;
        sendBtn.classList.remove('loading');
        messageInput.focus();
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = time;
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-content" style="padding: 12px 16px;">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Clear chat history
function clearHistory() {
    if (confirm('Are you sure you want to clear the entire chat history?')) {
        fetch('/api/clear-history', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <h2>Welcome to Chat</h2>
                    <p>Your intelligent chatbot assistant</p>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">Start typing to begin conversation...</p>
                </div>
            `;
            welcomeRemoved = false;
            messageInput.value = '';
            messageInput.focus();
        })
        .catch(error => console.error('Error:', error));
    }
}

// Shutdown server
async function shutdownServer() {
    if (!confirm('Bạn có chắc chắn muốn tắt bot không? Lịch sử chat sẽ được lưu.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/shutdown', {
            method: 'POST'
        });
        
        const data = await response.json();
        alert('Bot đang tắt... Cửa sổ sẽ đóng sau vài giây.');
        
        // Change button appearance to show shutdown in progress
        const shutdownBtn = document.querySelector('.shutdown-btn');
        if (shutdownBtn) {
            shutdownBtn.disabled = true;
            shutdownBtn.textContent = '⏳ Đang tắt...';
            shutdownBtn.style.opacity = '0.5';
        }
        
        // Close window after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tắt bot. Vui lòng thử lại hoặc dùng Ctrl+C');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

// Change chatbot style
async function toggleStyle() {
    try {
        // Get current style first
        const getResponse = await fetch('/api/get-style');
        const currentData = await getResponse.json();
        const newStyle = currentData.style === 1 ? 2 : 1;
        
        // Send change request
        const response = await fetch('/api/change-style', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ style: newStyle })
        });
        
        if (!response.ok) {
            throw new Error('Failed to change style');
        }
        
        const data = await response.json();
        
        // Update toggle switch UI and background
        updateStyleButton(newStyle);
        updateBackground(newStyle);
        
        // Clear chat display (but keep data on backend)
        chatMessages.innerHTML = '';
        messageInput.value = '';
        messageInput.focus();
        welcomeRemoved = false;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Update background image based on style
function updateBackground(style) {
    const chatMessages = document.getElementById('chatMessages');
    if (style === 1) {
        // Phong cách 1 (Nham hiểm) - Thay đổi tên file ảnh ở đây
        chatMessages.style.backgroundImage = "url('/static/MINGKING.jpg')";
    } else {
        // Phong cách 2 (Lịch sự) - Thay đổi tên file ảnh ở đây
        chatMessages.style.backgroundImage = "url('/static/meme1.jpg')";
    }
}

// Update style button appearance
async function updateStyleButton(style) {
    const toggle = document.getElementById('styleToggle');
    if (toggle) {
        if (style === 1) {
            toggle.classList.remove('active');
        } else {
            toggle.classList.add('active');
        }
    }
}

// Initialize style button on load
async function initializeStyleButton() {
    try {
        const response = await fetch('/api/get-style');
        const data = await response.json();
        updateStyleButton(data.style);
        updateBackground(data.style);
    } catch (error) {
        console.error('Error initializing style button:', error);
    }
}

// Event listeners
messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

// Focus input on page load
messageInput.focus();

// Initialize style button
initializeStyleButton();

// Show premium modal on load
showPremiumModal();

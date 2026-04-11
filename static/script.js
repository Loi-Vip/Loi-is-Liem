const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.querySelector('.send-btn');

// Remove welcome message when first real message is added
let welcomeRemoved = false;

// Store chat history separately for each style
let messagesStyle1 = [];
let messagesStyle2 = [];
let currentStyle = 1; // Track current style

// Initialize current style from server
async function initializeStyle() {
    try {
        const response = await fetch('/api/get-style');
        const data = await response.json();
        currentStyle = data.style;
        updateBackground(currentStyle);
        updateStyleButton(currentStyle);
        
        // Load messages for current style (can be extended if server stores separate histories)
        loadMessagesForCurrentStyle();
    } catch (error) {
        console.error('Error initializing style:', error);
    }
}

// Load and display messages for current style
function loadMessagesForCurrentStyle() {
    const messagesForStyle = currentStyle === 1 ? messagesStyle1 : messagesStyle2;
    
    if (messagesForStyle.length === 0) {
        // Show welcome message if no history
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to Chat</h2>
                <p>Your intelligent chatbot assistant</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Start typing to begin conversation...</p>
            </div>
        `;
        welcomeRemoved = false;
    } else {
        // Display previous messages
        chatMessages.innerHTML = '';
        welcomeRemoved = true;
        messagesForStyle.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = msg.text;
            
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = msg.time;
            
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(timeDiv);
            
            chatMessages.appendChild(messageDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize on page load
initializeStyle();

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
    
    // Save message to the current style's array
    const messageObject = { text, sender, time };
    if (currentStyle === 1) {
        messagesStyle1.push(messageObject);
    } else {
        messagesStyle2.push(messageObject);
    }
    
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

// Clear chat history for current style
function clearHistory() {
    if (confirm('Are you sure you want to clear the chat history for this style?')) {
        // Clear the messages array for current style
        if (currentStyle === 1) {
            messagesStyle1 = [];
        } else {
            messagesStyle2 = [];
        }
        
        // Update UI
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
        
        // Optionally notify server to clear backend history for this style too
        fetch('/api/clear-history', {
            method: 'POST'
        })
        .catch(error => console.error('Error:', error));
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
        
        // Update current style
        currentStyle = newStyle;
        
        // Clear chat display but keep history stored
        chatMessages.innerHTML = '';
        welcomeRemoved = false;
        
        // Display messages of the new style
        const messagesForStyle = currentStyle === 1 ? messagesStyle1 : messagesStyle2;
        
        if (messagesForStyle.length === 0) {
            // Show welcome message if no history
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <h2>Welcome to Chat</h2>
                    <p>Your intelligent chatbot assistant</p>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">Start typing to begin conversation...</p>
                </div>
            `;
        } else {
            // Display previous messages
            welcomeRemoved = true;
            messagesForStyle.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.sender}`;
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.textContent = msg.text;
                
                const timeDiv = document.createElement('div');
                timeDiv.className = 'message-time';
                timeDiv.textContent = msg.time;
                
                messageDiv.appendChild(contentDiv);
                messageDiv.appendChild(timeDiv);
                
                chatMessages.appendChild(messageDiv);
            });
        }
        
        // Update toggle switch UI and background
        updateStyleButton(newStyle);
        updateBackground(newStyle);
        
        // Focus input
        messageInput.focus();
        
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

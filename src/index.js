class ChatClient {
    constructor() {
        this.socket = null;
        this.username = null;
        this.init();
    }

    init() {
        // Элементы DOM
        this.modal = document.getElementById('nickname-modal');
        this.chatContainer = document.getElementById('chat-container');
        this.nicknameInput = document.getElementById('nickname-input');
        this.joinBtn = document.getElementById('join-btn');
        this.errorMsg = document.getElementById('error-message');
        this.usersList = document.getElementById('users-list');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');

        this.bindEvents();
    }

    bindEvents() {
        this.joinBtn.addEventListener('click', () => this.joinChat());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    joinChat() {
        const username = this.nicknameInput.value.trim();
        if (!username) {
            this.showError('Введите никнейм');
            return;
        }

        // Подключаемся к WebSocket
        this.socket = new WebSocket('ws://localhost:3001'); // замените на URL сервера Render

        this.socket.onopen = () => {
            this.socket.send(JSON.stringify({
                type: 'register',
                username: username
            }));
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    handleMessage(data) {
        switch (data.type) {
            case 'registered':
                if (data.success) {
                    this.username = data.username;
                    this.modal.classList.add('hidden');
                    this.chatContainer.classList.remove('hidden');
                } else {
                    this.showError('Никнейм занят, выберите другой');
                }
                break;
            case 'user_list':
                this.updateUsersList(data.users);
                break;
            case 'message':
                this.addMessage(data);
                break;
            case 'user_left':
                this.removeUser(data.userId);
                break;
        }
    }

    updateUsersList(users) {
        this.usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.name;
            this.usersList.appendChild(li);
        });
    }

    removeUser(userId) {
        Array.from(this.usersList.children).forEach(li => {
            if (li.textContent === userId) {
                li.remove();
            }
        });
    }

    addMessage(message) {
        const div = document.createElement('div');
        div.className = `message ${message.user.name === this.username ? 'my-message' : 'other-message'}`;
        div.innerHTML = `
      <strong>${message.user.name === this.username ? 'You' : message.user.name}:</strong>
      <span>${message.message}</span>
    `;
        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (text) {
            this.socket.send(JSON.stringify({
                type: 'send',
                message: text
            }));
            this.messageInput.value = '';
        }
    }

    showError(message) {
        this.errorMsg.textContent = message;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new ChatClient();
});

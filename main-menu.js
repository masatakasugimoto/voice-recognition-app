class ApplicationPortal {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Add click handlers for coming soon apps
        const comingSoonCards = document.querySelectorAll('.app-card.coming-soon');
        comingSoonCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.showComingSoonMessage();
            });
        });

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('app-card')) {
                e.target.click();
            }
        });
    }

    showComingSoonMessage() {
        const message = document.createElement('div');
        message.className = 'coming-soon-message';
        message.innerHTML = `
            <div class="message-content">
                <div class="message-icon">🚧</div>
                <h3>開発予定</h3>
                <p>このアプリケーションは現在開発中です。<br>しばらくお待ちください。</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        // Add styles for the message
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
        
        const messageContent = message.querySelector('.message-content');
        messageContent.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            margin: 20px;
        `;
        
        const messageIcon = message.querySelector('.message-icon');
        messageIcon.style.cssText = `
            font-size: 3em;
            margin-bottom: 20px;
        `;
        
        const messageButton = message.querySelector('button');
        messageButton.style.cssText = `
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            margin-top: 20px;
            transition: background 0.3s ease;
        `;
        
        messageButton.addEventListener('mouseover', () => {
            messageButton.style.background = '#5a6fd8';
        });
        
        messageButton.addEventListener('mouseout', () => {
            messageButton.style.background = '#667eea';
        });
        
        document.body.appendChild(message);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 3000);
    }

    updateStats() {
        // Update stats dynamically if needed
        const activeApps = document.querySelectorAll('.app-card:not(.coming-soon)').length;
        const comingApps = document.querySelectorAll('.app-card.coming-soon').length;
        
        const statItems = document.querySelectorAll('.stat-item');
        if (statItems.length >= 2) {
            statItems[0].querySelector('.stat-number').textContent = activeApps;
            statItems[1].querySelector('.stat-number').textContent = comingApps;
        }
    }
}

// Navigation function for opening applications
function openApp(appName) {
    switch (appName) {
        case 'voice-recognition':
            // Navigate to the voice recognition app
            window.location.href = 'index.html';
            break;
        case 'memo':
            // Future: Navigate to memo app
            showComingSoonMessage();
            break;
        case 'data-analysis':
            // Future: Navigate to data analysis app
            showComingSoonMessage();
            break;
        case 'weather':
            // Future: Navigate to weather app
            showComingSoonMessage();
            break;
        default:
            console.log('Unknown app:', appName);
    }
}

// Helper function for coming soon apps
function showComingSoonMessage() {
    const portal = new ApplicationPortal();
    portal.showComingSoonMessage();
}

// Initialize the application portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ApplicationPortal();
});

// Add smooth scrolling and animation effects
document.addEventListener('DOMContentLoaded', () => {
    // Animate cards on load
    const cards = document.querySelectorAll('.app-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
    
    // Animate header
    const header = document.querySelector('.header');
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        header.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 100);
    
    // Animate footer
    const footer = document.querySelector('.footer');
    footer.style.opacity = '0';
    footer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        footer.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        footer.style.opacity = '1';
        footer.style.transform = 'translateY(0)';
    }, 500);
});
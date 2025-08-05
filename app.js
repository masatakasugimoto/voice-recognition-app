class VoiceRecognitionApp {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recognition = null;
        this.currentTranscript = '';
        
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.statusText = document.getElementById('statusText');
        this.transcriptArea = document.getElementById('transcript');
        this.japaneseHistoryList = document.getElementById('japaneseHistoryList');
        this.translationHistoryList = document.getElementById('translationHistoryList');
        this.japaneseHistoryTab = document.getElementById('japaneseHistoryTab');
        this.translationHistoryTab = document.getElementById('translationHistoryTab');
        this.exportCurrentButton = document.getElementById('exportCurrentButton');
        this.exportHistoryButton = document.getElementById('exportHistoryButton');
        this.clearHistoryButton = document.getElementById('clearHistoryButton');
        
        this.enableTranslationCheckbox = document.getElementById('enableTranslation');
        this.enableSpeechCheckbox = document.getElementById('enableSpeech');
        this.targetLanguageSelect = document.getElementById('targetLanguage');
        this.translationSection = document.getElementById('translationSection');
        this.translationTitle = document.getElementById('translationTitle');
        this.translatedTextArea = document.getElementById('translatedText');
        
        this.historyData = [];
        this.translationHistoryData = [];
        this.currentHistoryView = 'japanese';
        this.currentRecognitionType = 'none';
        
        // 音声合成の初期化
        this.speechSynthesis = window.speechSynthesis;
        this.speechUtterance = null;
        this.availableEngines = {
            local: false,
            google: false,
            azure: false,
            aws: false
        };
        this.selectedEngine = 'local';
        
        this.setupEventListeners();
        this.checkBrowserSupport();
        this.checkSpeechSynthesisSupport();
        this.initializeRecognitionType();
        this.setupNavigationListeners();
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
        this.exportCurrentButton.addEventListener('click', () => this.exportCurrent());
        this.exportHistoryButton.addEventListener('click', () => this.exportHistory());
        this.clearHistoryButton.addEventListener('click', () => this.clearHistory());
        
        document.querySelectorAll('input[name="recognitionEngine"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleEngineChange(e.target.value));
        });
        
        this.enableTranslationCheckbox.addEventListener('change', () => this.toggleTranslation());
        this.enableSpeechCheckbox.addEventListener('change', () => this.toggleSpeech());
        this.targetLanguageSelect.addEventListener('change', () => this.updateTranslationTitle());
        
        this.japaneseHistoryTab.addEventListener('click', () => this.switchHistoryView('japanese'));
        this.translationHistoryTab.addEventListener('click', () => this.switchHistoryView('translation'));
    }
    
    async initializeRecognitionType() {
        this.availableEngines.local = this.isWebSpeechAPISupported();
        
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                this.availableEngines.google = config.hasGoogleAPI;
                this.availableEngines.azure = config.hasAzureAPI;
                this.availableEngines.aws = config.hasAWSAPI;
            }
        } catch (error) {
            console.log('クラウドAPI設定確認エラー:', error);
        }
        
        this.setupEngineOptions();
        this.updateTranslationTitle();
        this.toggleTranslation();
    }
    
    toggleTranslation() {
        const isEnabled = this.enableTranslationCheckbox.checked;
        this.translationSection.style.display = isEnabled ? 'block' : 'none';
        this.translationHistoryTab.style.display = isEnabled ? 'inline-block' : 'none';
        
        if (!isEnabled) {
            // 翻訳がOFFになった時は表示エリアをクリア
            this.clearTranslationDisplay();
            if (this.currentHistoryView === 'translation') {
                this.switchHistoryView('japanese');
            }
        }
    }
    
    toggleSpeech() {
        // 音声読み上げがOFFになった時は、現在の読み上げを停止
        if (!this.enableSpeechCheckbox.checked && this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }
    
    switchHistoryView(view) {
        this.currentHistoryView = view;
        
        if (view === 'japanese') {
            this.japaneseHistoryTab.classList.add('active');
            this.translationHistoryTab.classList.remove('active');
            this.japaneseHistoryList.style.display = 'block';
            this.translationHistoryList.style.display = 'none';
        } else {
            this.japaneseHistoryTab.classList.remove('active');
            this.translationHistoryTab.classList.add('active');
            this.japaneseHistoryList.style.display = 'none';
            this.translationHistoryList.style.display = 'block';
        }
    }
    
    updateTranslationTitle() {
        const langMap = {
            'en': '英語',
            'zh': '中国語',
            'de': 'ドイツ語',
            'it': 'イタリア語'
        };
        const selectedLang = this.targetLanguageSelect.value;
        const langName = langMap[selectedLang] || '英語';
        this.translationTitle.textContent = `🌍 翻訳結果 (${langName}):`;
        
        // 言語が変更された時は表示エリアをクリア
        this.clearTranslationDisplay();
    }
    
    clearTranslationDisplay() {
        this.translatedTextArea.innerHTML = '';
    }
    
    setupEngineOptions() {
        const googleOption = document.getElementById('googleEngineOption');
        
        if (this.availableEngines.google) {
            googleOption.style.display = 'block';
        } else {
            googleOption.style.display = 'none';
        }
        
        if (!this.availableEngines.local) {
            const localRadio = document.querySelector('input[value="local"]');
            const localOption = localRadio.closest('.engine-option');
            localOption.style.opacity = '0.5';
            localRadio.disabled = true;
            
            if (this.availableEngines.google) {
                this.selectedEngine = 'google';
                document.querySelector('input[value="google"]').checked = true;
            }
        }
    }
    
    handleEngineChange(engine) {
        this.selectedEngine = engine;
        this.currentRecognitionType = this.selectedEngine;
    }
    
    
    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateStatus('このブラウザは音声録音をサポートしていません', 'error');
            this.startButton.disabled = true;
            return false;
        }
        return true;
    }
    
    checkSpeechSynthesisSupport() {
        if (!window.speechSynthesis) {
            // 音声合成がサポートされていない場合、チェックボックスを無効化
            this.enableSpeechCheckbox.disabled = true;
            this.enableSpeechCheckbox.checked = false;
            const speechLabel = this.enableSpeechCheckbox.closest('label');
            if (speechLabel) {
                speechLabel.style.opacity = '0.5';
                speechLabel.title = 'このブラウザは音声読み上げをサポートしていません';
            }
            console.log('音声合成はサポートされていません');
        } else {
            console.log('音声合成がサポートされています');
        }
    }
    
    async startRecording() {
        try {
            this.updateStatus('音声認識を開始します...', 'waiting');
            this.currentTranscript = '';
            this.transcriptArea.textContent = '';
            
            this.isRecording = true;
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.stopButton.classList.add('recording');
            
            if (this.isWebSpeechAPISupported()) {
                this.startWebSpeechRecognition();
            } else if (this.selectedEngine === 'google' || this.selectedEngine === 'azure' || this.selectedEngine === 'aws') {
                await this.startMediaRecorderFallback();
            } else {
                await this.startMediaRecorderFallback();
            }
            
        } catch (error) {
            console.error('録音開始エラー:', error);
            this.updateStatus('音声認識の開始に失敗しました', 'error');
            this.resetButtons();
        }
    }

    startWebSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            const engineName = this.selectedEngine === 'google' ? 'Google音声認識' :
                             this.selectedEngine === 'azure' ? 'Azure音声認識' :
                             this.selectedEngine === 'aws' ? 'AWS音声認識' :
                             'ローカル音声認識';
            this.updateStatus(`音声認識中... 話してください（${engineName}使用）`, 'recording');
        };
        
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                this.currentTranscript += finalTranscript;
                this.addToHistory(finalTranscript);
                
                if (this.enableTranslationCheckbox.checked && finalTranscript.trim()) {
                    this.translateText(finalTranscript);
                }
                
                if (this.selectedEngine === 'google' && finalTranscript.trim()) {
                    this.sendFinalTranscriptToGoogle(finalTranscript);
                }
            }
            
            this.transcriptArea.textContent = this.currentTranscript + interimTranscript;
        };
        
        this.recognition.onerror = (event) => {
            console.error('音声認識エラー:', event.error);
            if (event.error !== 'no-speech') {
                this.updateStatus('音声認識エラー: ' + event.error, 'error');
            }
        };
        
        this.recognition.onend = () => {
            if (this.isRecording) {
                this.recognition.start();
            }
        };
        
        this.recognition.start();
    }

    async startMediaRecorderFallback() {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            } 
        });
        
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: this.getSupportedMimeType()
        });
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.handleRecordingStop(stream);
        };
        
        this.mediaRecorder.start(1000);
        
        const recognitionName = this.selectedEngine === 'google' ? 'Google音声認識' : 
                               this.selectedEngine === 'azure' ? 'Azure音声認識' :
                               this.selectedEngine === 'aws' ? 'AWS音声認識' : 'クラウド音声認識';
        
        this.updateStatus(`録音中... 話してください（${recognitionName}使用）`, 'recording');
    }
    
    stopRecording() {
        this.isRecording = false;
        
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        
        this.resetButtons();
        
        if (this.currentTranscript) {
            this.updateStatus('音声認識完了', 'success');
            this.updateExportButtons();
        } else {
            this.updateStatus('音声認識を停止しました', 'info');
        }
    }
    
    handleRecordingStop(stream) {
        stream.getTracks().forEach(track => track.stop());
        
        if (this.audioChunks.length === 0) {
            this.updateStatus('音声データが記録されませんでした', 'error');
            return;
        }
        
        const audioBlob = new Blob(this.audioChunks, { 
            type: this.getSupportedMimeType() 
        });
        
        this.updateStatus('音声認識処理中...', 'processing');
        this.sendToSpeechAPI(audioBlob);
    }
    
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    }
    
    async sendToSpeechAPI(audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('language', 'ja-JP');
            
            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.displayTranscription(result.transcription || result.text);
            
        } catch (error) {
            console.error('音声認識API エラー:', error);
            
            if (this.isWebSpeechAPISupported()) {
                this.updateStatus('クラウドAPIが利用できません。ブラウザの音声認識を使用します...', 'warning');
                this.fallbackToWebSpeechAPI();
            } else {
                this.updateStatus('音声認識に失敗しました: ' + error.message, 'error');
            }
        }
    }
    
    isWebSpeechAPISupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    fallbackToWebSpeechAPI() {
        this.updateStatus('ブラウザの音声認識を使用します...', 'warning');
        this.startWebSpeechRecognition();
    }
    
    displayTranscription(text) {
        if (!text || text.trim() === '') {
            this.updateStatus('音声が認識されませんでした', 'warning');
            return;
        }
        
        this.currentTranscript = text;
        this.transcriptArea.textContent = text;
        this.updateStatus('音声認識完了', 'success');
        
        if (this.enableTranslationCheckbox.checked) {
            this.translateText(text);
        }
        
        this.addToHistory(text);
    }
    
    async translateText(text) {
        if (!text || text.trim() === '') {
            return;
        }
        
        try {
            // 翻訳中インジケーターを一時的に表示
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'translation-loading';
            loadingIndicator.textContent = '翻訳中...';
            this.translatedTextArea.appendChild(loadingIndicator);
            
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    targetLanguage: this.targetLanguageSelect.value
                })
            });
            
            if (!response.ok) {
                throw new Error(`翻訳API エラー: ${response.status}`);
            }
            
            const result = await response.json();
            
            // ローディングインジケーターを削除
            this.translatedTextArea.removeChild(loadingIndicator);
            
            // 翻訳結果を表示エリアに追加
            this.addTranslationToDisplay(text, result.translatedText, this.targetLanguageSelect.value);
            
            // 翻訳結果を履歴に追加
            this.addToTranslationHistory(text, result.translatedText, this.targetLanguageSelect.value);
            
        } catch (error) {
            console.error('翻訳エラー:', error);
            
            // エラー時はローディングインジケーターを削除してエラーメッセージを表示
            const loadingElements = this.translatedTextArea.querySelectorAll('.translation-loading');
            loadingElements.forEach(el => el.remove());
            
            const errorElement = document.createElement('div');
            errorElement.className = 'translation-error';
            errorElement.textContent = '翻訳に失敗しました';
            this.translatedTextArea.appendChild(errorElement);
        }
    }
    
    addTranslationToDisplay(originalText, translatedText, targetLanguage) {
        // 既存のテキストに翻訳結果を追加（音声認識結果と同じ形式）
        const currentText = this.translatedTextArea.textContent;
        const newText = currentText + (currentText ? ' ' : '') + translatedText;
        this.translatedTextArea.textContent = newText;
        
        // 音声読み上げが有効な場合、翻訳結果を読み上げる
        if (this.enableSpeechCheckbox.checked) {
            this.speakTranslation(translatedText, targetLanguage);
        }
    }
    
    speakTranslation(text, targetLanguage) {
        if (!this.speechSynthesis || !text || text.trim() === '') {
            return;
        }
        
        try {
            // 現在の読み上げを停止
            this.speechSynthesis.cancel();
            
            // 新しい読み上げを作成
            this.speechUtterance = new SpeechSynthesisUtterance(text);
            
            // 言語設定のマッピング
            const languageMap = {
                'en': 'en-US',
                'zh': 'zh-CN', 
                'de': 'de-DE',
                'it': 'it-IT'
            };
            
            this.speechUtterance.lang = languageMap[targetLanguage] || 'en-US';
            this.speechUtterance.rate = 0.9; // 少し遅めの速度
            this.speechUtterance.pitch = 1.0; // 標準のピッチ
            this.speechUtterance.volume = 0.8; // 少し控えめの音量
            
            // エラーハンドリング
            this.speechUtterance.onerror = (event) => {
                console.error('音声読み上げエラー:', event.error);
            };
            
            // 読み上げ開始
            this.speechSynthesis.speak(this.speechUtterance);
            
        } catch (error) {
            console.error('音声読み上げ機能エラー:', error);
        }
    }
    
    addToHistory(text) {
        const timestamp = new Date();
        const timestampStr = timestamp.toLocaleString('ja-JP');
        
        const historyData = {
            text: text.trim(),
            timestamp: timestamp.toISOString(),
            timestampDisplay: timestampStr
        };
        
        this.historyData.unshift(historyData);
        
        if (this.historyData.length > 50) {
            this.historyData.pop();
        }
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-timestamp">${timestampStr}</div>
            <div>${text}</div>
        `;
        
        this.japaneseHistoryList.insertBefore(historyItem, this.japaneseHistoryList.firstChild);
        
        if (this.japaneseHistoryList.children.length > 10) {
            this.japaneseHistoryList.removeChild(this.japaneseHistoryList.lastChild);
        }
        
        this.updateExportButtons();
    }
    
    addToTranslationHistory(originalText, translatedText, targetLanguage) {
        const timestamp = new Date();
        const timestampStr = timestamp.toLocaleString('ja-JP');
        
        const langMap = {
            'en': '英語',
            'zh': '中国語',
            'de': 'ドイツ語',
            'it': 'イタリア語'
        };
        const langName = langMap[targetLanguage] || '英語';
        
        const translationData = {
            originalText: originalText.trim(),
            translatedText: translatedText.trim(),
            targetLanguage: targetLanguage,
            targetLanguageName: langName,
            timestamp: timestamp.toISOString(),
            timestampDisplay: timestampStr
        };
        
        this.translationHistoryData.unshift(translationData);
        
        if (this.translationHistoryData.length > 50) {
            this.translationHistoryData.pop();
        }
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item translation-history-item';
        
        historyItem.innerHTML = `
            <div class="history-timestamp">${timestampStr} (${langName})</div>
            <div class="original-text">🎤 ${originalText}</div>
            <div class="translated-text">🌍 ${translatedText}</div>
        `;
        
        this.translationHistoryList.insertBefore(historyItem, this.translationHistoryList.firstChild);
        
        if (this.translationHistoryList.children.length > 10) {
            this.translationHistoryList.removeChild(this.translationHistoryList.lastChild);
        }
        
        this.updateExportButtons();
    }
    
    updateStatus(message, type = 'info') {
        this.statusText.textContent = message;
        this.statusText.className = `status-${type}`;
    }
    
    resetButtons() {
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        this.stopButton.classList.remove('recording');
    }
    
    updateExportButtons() {
        const hasCurrentText = this.currentTranscript && this.currentTranscript.trim() !== '';
        const hasJapaneseHistory = this.historyData.length > 0;
        const hasTranslationHistory = this.translationHistoryData.length > 0;
        const hasAnyHistory = hasJapaneseHistory || hasTranslationHistory;
        
        this.exportCurrentButton.disabled = !hasCurrentText;
        this.exportHistoryButton.disabled = !hasAnyHistory;
        this.clearHistoryButton.disabled = !hasAnyHistory;
    }
    
    
    exportCurrent() {
        if (!this.currentTranscript || this.currentTranscript.trim() === '') {
            alert('エクスポートする認識結果がありません');
            return;
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `speech-recognition-current-${timestamp}.txt`;
        
        let content = `音声認識結果\n`;
        content += `日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
        content += this.currentTranscript.trim();
        
        this.downloadFile(content, filename, 'text/plain');
    }
    
    exportHistory() {
        const hasJapaneseHistory = this.historyData.length > 0;
        const hasTranslationHistory = this.translationHistoryData.length > 0;
        
        if (!hasJapaneseHistory && !hasTranslationHistory) {
            alert('エクスポートする履歴がありません');
            return;
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `speech-recognition-history-${timestamp}.txt`;
        
        let content = `音声認識・翻訳履歴\n`;
        content += `エクスポート日時: ${new Date().toLocaleString('ja-JP')}\n`;
        content += `日本語履歴: ${this.historyData.length}件\n`;
        content += `翻訳履歴: ${this.translationHistoryData.length}件\n\n`;
        content += '==========================================\n\n';
        
        if (hasJapaneseHistory) {
            content += '【日本語音声認識履歴】\n\n';
            this.historyData.forEach((item, index) => {
                content += `${index + 1}. ${item.timestampDisplay}\n`;
                content += `${item.text}\n\n`;
            });
            content += '\n';
        }
        
        if (hasTranslationHistory) {
            content += '【翻訳履歴】\n\n';
            this.translationHistoryData.forEach((item, index) => {
                content += `${index + 1}. ${item.timestampDisplay} (${item.targetLanguageName})\n`;
                content += `🎤 日本語: ${item.originalText}\n`;
                content += `🌍 翻訳: ${item.translatedText}\n\n`;
            });
        }
        
        this.downloadFile(content, filename, 'text/plain');
    }
    
    clearHistory() {
        const hasJapaneseHistory = this.historyData.length > 0;
        const hasTranslationHistory = this.translationHistoryData.length > 0;
        
        if (!hasJapaneseHistory && !hasTranslationHistory) {
            return;
        }
        
        if (confirm('履歴をすべて削除してもよろしいですか？')) {
            this.historyData = [];
            this.translationHistoryData = [];
            this.japaneseHistoryList.innerHTML = '';
            this.translationHistoryList.innerHTML = '';
            this.updateExportButtons();
            this.updateStatus('履歴をクリアしました', 'success');
        }
    }
    
    downloadFile(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            this.updateStatus(`ファイルをダウンロードしました: ${filename}`, 'success');
            
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            this.updateStatus('ファイルのダウンロードに失敗しました', 'error');
        }
    }
    
    async sendFinalTranscriptToGoogle(text) {
        if (!text || text.trim() === '' || this.selectedEngine !== 'google') {
            return;
        }
        
        try {
            console.log('Google APIで認識結果を改善中:', text);
            
        } catch (error) {
            console.error('Google API送信エラー:', error);
        }
    }
    
    setupNavigationListeners() {
        const backButton = document.getElementById('backToMenuButton');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.location.href = 'main-menu.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new VoiceRecognitionApp();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    }
});
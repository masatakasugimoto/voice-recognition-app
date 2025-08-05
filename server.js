const express = require('express');
const https = require('https');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 80;

app.set('trust proxy', 1);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.use(express.static('.'));
app.use(express.json());

const SPEECH_API_CONFIG = {
    google: {
        apiKey: process.env.GOOGLE_API_KEY,
        url: 'https://speech.googleapis.com/v1/speech:recognize'
    },
    azure: {
        subscriptionKey: process.env.AZURE_SPEECH_KEY,
        region: process.env.AZURE_REGION || 'japaneast',
        url: function(region) {
            return `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
        }
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'ap-northeast-1'
    }
};

const TRANSLATE_API_CONFIG = {
    google: {
        apiKey: process.env.GOOGLE_API_KEY,
        url: 'https://translation.googleapis.com/language/translate/v2'
    }
};

app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'オーディオファイルが見つかりません' });
        }

        const language = req.body.language || 'ja-JP';
        const audioBuffer = req.file.buffer;
        
        console.log(`音声認識開始 - ファイルサイズ: ${audioBuffer.length} bytes, 言語: ${language}`);

        let transcription = '';

        if (SPEECH_API_CONFIG.google.apiKey) {
            transcription = await recognizeWithGoogle(audioBuffer, language);
        } else if (SPEECH_API_CONFIG.azure.subscriptionKey) {
            transcription = await recognizeWithAzure(audioBuffer, language);
        } else if (SPEECH_API_CONFIG.aws.accessKeyId) {
            transcription = await recognizeWithAWS(audioBuffer, language);
        } else {
            throw new Error('音声認識APIの設定がありません。環境変数を確認してください。');
        }

        console.log('音声認識結果:', transcription);
        
        res.json({
            transcription: transcription,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('音声認識エラー:', error);
        res.status(500).json({ 
            error: '音声認識に失敗しました',
            details: error.message
        });
    }
});

app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: '翻訳するテキストが見つかりません' });
        }
        
        if (!targetLanguage) {
            return res.status(400).json({ error: '翻訳先言語が指定されていません' });
        }
        
        console.log(`翻訳開始 - テキスト: "${text}", 翻訳先: ${targetLanguage}`);
        
        let translatedText = '';
        
        if (TRANSLATE_API_CONFIG.google.apiKey) {
            translatedText = await translateWithGoogle(text, targetLanguage);
        } else {
            throw new Error('翻訳APIの設定がありません。環境変数を確認してください。');
        }
        
        console.log('翻訳結果:', translatedText);
        
        res.json({
            originalText: text,
            translatedText: translatedText,
            targetLanguage: targetLanguage,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('翻訳エラー:', error);
        res.status(500).json({
            error: '翻訳に失敗しました',
            details: error.message
        });
    }
});

async function translateWithGoogle(text, targetLanguage) {
    try {
        const response = await fetch(
            `${TRANSLATE_API_CONFIG.google.url}?key=${TRANSLATE_API_CONFIG.google.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: text,
                    target: targetLanguage,
                    source: 'ja',
                    format: 'text'
                })
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Translate API エラー: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.translations && data.data.translations.length > 0) {
            return data.data.translations[0].translatedText;
        } else {
            throw new Error('翻訳結果が見つかりませんでした');
        }
    } catch (error) {
        throw new Error(`Google Translate API エラー: ${error.message}`);
    }
}

async function recognizeWithGoogle(audioBuffer, language) {
    try {
        const base64Audio = audioBuffer.toString('base64');
        
        const requestBody = {
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: language,
                enableAutomaticPunctuation: true,
                model: 'latest_long'
            },
            audio: {
                content: base64Audio
            }
        };

        const response = await fetch(
            `${SPEECH_API_CONFIG.google.url}?key=${SPEECH_API_CONFIG.google.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Speech API エラー: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].alternatives[0].transcript;
        } else {
            throw new Error('音声が認識されませんでした');
        }
    } catch (error) {
        throw new Error(`Google Speech API エラー: ${error.message}`);
    }
}

async function recognizeWithAzure(audioBuffer, language) {
    try {
        const region = SPEECH_API_CONFIG.azure.region;
        const url = SPEECH_API_CONFIG.azure.url(region);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': SPEECH_API_CONFIG.azure.subscriptionKey,
                'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                'Accept': 'application/json'
            },
            body: audioBuffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure Speech API エラー: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.DisplayText) {
            return data.DisplayText;
        } else {
            throw new Error('音声が認識されませんでした');
        }
    } catch (error) {
        throw new Error(`Azure Speech API エラー: ${error.message}`);
    }
}

async function recognizeWithAWS(audioBuffer, language) {
    try {
        const AWS = require('aws-sdk');
        
        AWS.config.update({
            accessKeyId: SPEECH_API_CONFIG.aws.accessKeyId,
            secretAccessKey: SPEECH_API_CONFIG.aws.secretAccessKey,
            region: SPEECH_API_CONFIG.aws.region
        });

        const transcribeservice = new AWS.TranscribeService();
        
        throw new Error('AWS Transcribe は現在サポートされていません。リアルタイム音声認識には別の実装が必要です。');
        
    } catch (error) {
        throw new Error(`AWS Transcribe エラー: ${error.message}`);
    }
}

app.get('/api/config', (req, res) => {
    console.log('API設定状況:');
    console.log('  Google API Key:', SPEECH_API_CONFIG.google.apiKey ? '設定済み' : '未設定');
    console.log('  Azure Subscription Key:', SPEECH_API_CONFIG.azure.subscriptionKey ? '設定済み' : '未設定');
    console.log('  AWS Access Key:', SPEECH_API_CONFIG.aws.accessKeyId ? '設定済み' : '未設定');
    console.log('  Google Translate API Key:', TRANSLATE_API_CONFIG.google.apiKey ? '設定済み' : '未設定');
    
    const config = {
        hasGoogleAPI: !!SPEECH_API_CONFIG.google.apiKey,
        hasAzureAPI: !!SPEECH_API_CONFIG.azure.subscriptionKey,
        hasAWSAPI: !!SPEECH_API_CONFIG.aws.accessKeyId,
        hasTranslateAPI: !!TRANSLATE_API_CONFIG.google.apiKey,
        supportedLanguages: ['ja-JP', 'en-US', 'zh-CN', 'ko-KR']
    };
    
    console.log('レスポンス:', config);
    res.json(config);
});

// 翻訳APIテスト用エンドポイント
app.get('/api/translate/test', async (req, res) => {
    try {
        const testText = 'こんにちは';
        const targetLang = 'en';
        
        console.log('翻訳APIテスト開始');
        console.log('API Key:', TRANSLATE_API_CONFIG.google.apiKey ? '設定済み' : '未設定');
        console.log('URL:', TRANSLATE_API_CONFIG.google.url);
        
        if (!TRANSLATE_API_CONFIG.google.apiKey) {
            return res.status(500).json({ 
                error: 'Google API Keyが設定されていません',
                hasApiKey: false
            });
        }
        
        const result = await translateWithGoogle(testText, targetLang);
        
        res.json({
            success: true,
            originalText: testText,
            translatedText: result,
            targetLanguage: targetLang
        });
        
    } catch (error) {
        console.error('翻訳テストエラー:', error);
        res.status(500).json({
            error: error.message,
            hasApiKey: !!TRANSLATE_API_CONFIG.google.apiKey
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            google: !!SPEECH_API_CONFIG.google.apiKey,
            azure: !!SPEECH_API_CONFIG.azure.subscriptionKey,
            aws: !!SPEECH_API_CONFIG.aws.accessKeyId
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SSL証明書の設定
let sslOptions;
try {
    sslOptions = {
        key: fs.readFileSync(path.join(__dirname, 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
    };
} catch (error) {
    console.log('⚠️  SSL証明書が見つかりません。HTTPサーバーのみ起動します。');
}

// HTTPサーバー (ポート80)
http.createServer(app).listen(80, '0.0.0.0', () => {
    console.log(`🎤 HTTPサーバーが起動しました`);
    console.log(`📡 HTTP URL: http://localhost/`);
});

// HTTPSサーバー (ポート443) - SSL証明書がある場合のみ
if (sslOptions) {
    https.createServer(sslOptions, app).listen(443, '0.0.0.0', () => {
        console.log(`🔒 HTTPSサーバーが起動しました`);
        console.log(`📡 HTTPS URL: https://localhost/`);
    });
}

console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 設定状況:`);
console.log(`   - Google Speech API: ${SPEECH_API_CONFIG.google.apiKey ? '✓ 設定済み' : '✗ 未設定'}`);
console.log(`   - Azure Speech API: ${SPEECH_API_CONFIG.azure.subscriptionKey ? '✓ 設定済み' : '✗ 未設定'}`);
console.log(`   - AWS Transcribe: ${SPEECH_API_CONFIG.aws.accessKeyId ? '✓ 設定済み' : '✗ 未設定'}`);

if (!SPEECH_API_CONFIG.google.apiKey && !SPEECH_API_CONFIG.azure.subscriptionKey && !SPEECH_API_CONFIG.aws.accessKeyId) {
    console.log(`⚠️  警告: クラウド音声認識APIが設定されていません`);
    console.log(`   ブラウザの音声認識機能のみが利用可能です`);
}
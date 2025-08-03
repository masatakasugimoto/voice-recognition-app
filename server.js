const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    
    const config = {
        hasGoogleAPI: !!SPEECH_API_CONFIG.google.apiKey,
        hasAzureAPI: !!SPEECH_API_CONFIG.azure.subscriptionKey,
        hasAWSAPI: !!SPEECH_API_CONFIG.aws.accessKeyId,
        supportedLanguages: ['ja-JP', 'en-US', 'zh-CN', 'ko-KR']
    };
    
    console.log('レスポンス:', config);
    res.json(config);
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎤 音声認識サーバーが起動しました`);
    console.log(`📡 サーバーURL: http://localhost:${PORT}`);
    console.log(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 設定状況:`);
    console.log(`   - Google Speech API: ${SPEECH_API_CONFIG.google.apiKey ? '✓ 設定済み' : '✗ 未設定'}`);
    console.log(`   - Azure Speech API: ${SPEECH_API_CONFIG.azure.subscriptionKey ? '✓ 設定済み' : '✗ 未設定'}`);
    console.log(`   - AWS Transcribe: ${SPEECH_API_CONFIG.aws.accessKeyId ? '✓ 設定済み' : '✗ 未設定'}`);
    
    if (!SPEECH_API_CONFIG.google.apiKey && !SPEECH_API_CONFIG.azure.subscriptionKey && !SPEECH_API_CONFIG.aws.accessKeyId) {
        console.log(`⚠️  警告: クラウド音声認識APIが設定されていません`);
        console.log(`   ブラウザの音声認識機能のみが利用可能です`);
    }
});
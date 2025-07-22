# Voice Bot Setup Guide

## Assembly AI Configuration

The voice bot feature uses Assembly AI for audio transcription. Follow these steps to set it up:

### 1. Get Assembly AI API Key

1. Go to [Assembly AI](https://www.assemblyai.com/)
2. Sign up for a free account
3. Navigate to your API key in the dashboard
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env` file in the `snq-fe` directory with:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_LOGIN_URL=http://localhost:8000/auth/login

# Assembly AI Configuration
VITE_ASSEMBLY_AI_KEY=your-actual-api-key-here
```

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

### 4. Test the Voice Bot

1. Open the dashboard
2. Click the microphone button in the bottom-right corner
3. Allow microphone permissions
4. Record your voice
5. Click "Transcribe Audio"
6. The transcription should appear and can be saved to notes

## Troubleshooting

### Common Issues

1. **400 Bad Request Error**
   - Check that your API key is correct
   - Ensure the API key is properly set in environment variables
   - Verify the API key has sufficient credits

2. **Microphone Permission Denied**
   - Check browser permissions
   - Try refreshing the page
   - Use HTTPS in production (required for microphone access)

3. **Transcription Fails**
   - Check browser console for detailed error messages
   - Verify internet connection
   - Ensure audio quality is good

### Mock Mode

If no API key is configured, the voice bot will use mock transcription for testing purposes.

## API Usage

The voice bot uses the following Assembly AI endpoints:
- `POST /v2/transcript` - Submit audio for transcription
- `GET /v2/transcript/{id}` - Check transcription status

## Features

- Real-time audio recording
- Automatic transcription
- Notes integration
- Error handling and retry logic
- Loading states and user feedback 
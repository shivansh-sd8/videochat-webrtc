# WebRTC Video Call Application

A simple peer-to-peer video calling application using WebRTC with a Node.js signaling server.

## Features

- 🎥 Real-time video and audio streaming
- 💬 Text chat via WebRTC data channels
- 🔄 Automatic peer connection establishment
- 📊 Connection status indicators
- 🎨 Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- npm
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the signaling server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Open the same URL in a **second browser window** (or different browser/incognito mode)

4. Click "Start Video Call" in both windows

5. The peers will automatically connect and you'll see each other's video streams

## How It Works

### Architecture

1. **Signaling Server** (`server.js`): 
   - Express.js server with Socket.IO
   - Facilitates SDP (Session Description Protocol) exchange
   - Relays ICE candidates between peers
   - Tracks connected users

2. **Client** (`index.html`):
   - Captures local video/audio using `getUserMedia`
   - Creates WebRTC peer connections
   - Exchanges connection information via Socket.IO
   - Establishes direct peer-to-peer connection
   - Supports text chat via data channels

### Connection Flow

1. Both peers connect to the signaling server
2. First peer starts camera and waits
3. Second peer starts camera and initiates connection
4. Peers exchange SDP offers/answers via server
5. Peers exchange ICE candidates for NAT traversal
6. Direct peer-to-peer connection established
7. Video/audio streams and data channel become active

## Troubleshooting

### Camera/Microphone Access Denied
- Check browser permissions for camera and microphone
- Ensure you're using HTTPS or localhost (required for getUserMedia)

### Connection Fails
- Check that both peers are on the same network or use TURN servers for NAT traversal
- Verify firewall settings aren't blocking WebRTC connections
- Check browser console for error messages

### No Video Showing
- Ensure both peers clicked "Start Video Call"
- Check that camera is not being used by another application
- Try refreshing both browser windows

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Opera

## Network Requirements

This basic setup works for peers on the same local network. For connections across different networks (NAT traversal), you may need to configure TURN servers in addition to the STUN servers already included.

## Development

To run with auto-restart on file changes:
```bash
npm run dev
```

## Port Configuration

Default port: 3000

To change the port, set the PORT environment variable:
```bash
PORT=8080 npm start
```

## Security Notes

- This is a development/demo application
- For production use, implement:
  - HTTPS/TLS encryption
  - User authentication
  - Rate limiting
  - TURN server configuration
  - Proper error handling and logging

## License

MIT

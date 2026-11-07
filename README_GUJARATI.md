# Parth Live Video Call — Starter Project

આ Windows માટેનો MVP source project છે. તેમાં:
- Admin room બનાવે છે અને password નક્કી કરે છે
- Guest URL + password વડે જોડાય છે
- LiveKit દ્વારા WebRTC video/audio
- દરેક participant માટે OBS/vMix Browser Source output URL
- React website + Node.js token backend

## મહત્વની મર્યાદા
આ ZIP માં application source code છે; તે પોતે hosted public service નથી. Laptop પર local test માટે LiveKit server પણ ચલાવવો પડશે. બહારના શહેરના guests માટે public HTTPS domain, firewall/network setup અને TURN server જરૂરી છે. માત્ર `localhost` link મોકલવાથી બહારના લોકો જોડાઈ શકતા નથી.

## 1. જરૂરી software
1. Node.js LTS: https://nodejs.org/
2. VS Code: https://code.visualstudio.com/
3. LiveKit server: https://github.com/livekit/livekit/releases
4. OBS / vMix (તમારી પાસે હોય તો)

## 2. LiveKit local server
Windows પર LiveKit server executable download કરો. આ project માં `livekit.yaml.example` છે.
તેની નકલ `livekit.yaml` નામે કરો અને development માટે નીચેના values વાપરો:
- API key: `devkey`
- API secret: `secret`
- WebSocket URL: `ws://localhost:7880`

LiveKit server ચલાવવાની રીત release/version પ્રમાણે બદલાઈ શકે છે. સામાન્ય રીતે:
`livekit-server.exe --config livekit.yaml`

Local development માટે LiveKit documentation જુઓ:
https://docs.livekit.io/transport/self-hosting/

## 3. Backend શરૂ કરો
CMD:
```bat
cd backend
copy .env.example .env
npm install
npm run dev
```
Backend `http://localhost:3001` પર ચાલશે.

## 4. Website શરૂ કરો
બીજા CMD માં:
```bat
cd frontend
copy .env.example .env
npm install
npm run dev -- --host 0.0.0.0
```
Website `http://localhost:5173` પર ખુલશે.

## 5. Local test
- Admin: `http://localhost:5173`
- Admin PIN default: `.env` માં `ADMIN_PIN` બદલો.
- Room બનાવો, guest link copy કરો.
- એ જ Laptop અથવા એ જ Wi-Fi પર બીજા device માં guest link ખોલો.
- Camera/mic permission allow કરો.

જો બીજા device પરથી ખોલો છો તો `localhost` નહીં, Laptop નો LAN IP વાપરો. Backend `.env` માં `APP_ORIGIN` અને frontend `.env` માં `VITE_API_URL` LAN IP પ્રમાણે બદલો. LiveKit WebSocket URL પણ LAN IP પ્રમાણે બદલો.

## 6. OBS / vMix
Room માં guest જોડાયા પછી Admin dashboard માં મળતો output link OBS Browser Source અથવા vMix Web Browser Input માં મૂકો.
Output page camera/mic controls વગર માત્ર video render કરે છે. દરેક guest માટે અલગ output URL છે.

## 7. Security / production
આ starter MVP છે. Public production પહેલાં:
- HTTPS + WSS
- Strong admin credentials and password hashing
- Persistent database
- Rate limiting and room expiry
- TURN server (coturn)
- Firewall rules and LiveKit ports
- Moderation, consent and privacy notice
જરૂરી છે. `.env` secrets ક્યારેય જાહેર ન કરો.

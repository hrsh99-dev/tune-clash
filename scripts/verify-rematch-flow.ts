import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '@tune-clash/shared';

const SERVER_URL = 'http://localhost:4000';

async function runRematchVerification() {
  console.log('--- Starting Rematch & Settings Change Flow Verification ---');

  // 1. Create Room via REST
  const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: 'RematchHost' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.roomCode;
  const hostPlayerId = createData.player.playerId;
  const hostToken = createData.reconnectToken;
  console.log(`✓ Room created: ${roomCode}`);

  // 2. Join second player via REST
  const joinRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: 'RematchGuest' }),
  });
  const joinData = await joinRes.json();
  const guestPlayerId = joinData.player.playerId;
  const guestToken = joinData.reconnectToken;
  console.log(`✓ Guest joined via REST: ${guestPlayerId}`);

  // 3. Connect Sockets
  const hostSocket = io(SERVER_URL, { transports: ['websocket'], autoConnect: false });
  const guestSocket = io(SERVER_URL, { transports: ['websocket'], autoConnect: false });

  hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err: any) => {
    console.error('[Host Error Event]:', err);
  });
  guestSocket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err: any) => {
    console.error('[Guest Error Event]:', err);
  });

  const connectAndJoin = () =>
    new Promise<void>((resolve) => {
      let count = 0;
      const done = () => {
        count++;
        if (count === 2) resolve();
      };

      hostSocket.once('connect', () => {
        hostSocket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
          roomCode,
          playerId: hostPlayerId,
          nickname: 'RematchHost',
          reconnectToken: hostToken,
        });
      });
      hostSocket.once(SOCKET_EVENTS.SERVER_REJOINED, done);

      guestSocket.once('connect', () => {
        guestSocket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
          roomCode,
          playerId: guestPlayerId,
          nickname: 'RematchGuest',
          reconnectToken: guestToken,
        });
      });
      guestSocket.once(SOCKET_EVENTS.SERVER_REJOINED, done);

      hostSocket.connect();
      guestSocket.connect();
    });

  await connectAndJoin();
  console.log('✓ Both players connected and joined via socket.');

  // Set 1 round for quick test
  hostSocket.emit(SOCKET_EVENTS.CLIENT_SETTINGS_UPDATE, {
    clipSeconds: 6,
    roundCount: 1,
    languages: ['Hindi'],
    categories: ['Bollywood'],
  });
  await new Promise((r) => setTimeout(r, 400));

  // Guest marks ready
  await new Promise<void>((resolve) => {
    const onState = (state: any) => {
      const g = state.players?.find((p: any) => p.playerId === guestPlayerId);
      if (g?.isReady) {
        hostSocket.off(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
        resolve();
      }
    };
    hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
    guestSocket.emit(SOCKET_EVENTS.CLIENT_READY_SET, { ready: true });
  });
  console.log('✓ Guest marked ready.');

  // Game 1 Start
  const game1StartedPromise = new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_GAME_STARTED, () => {
      console.log('✓ Game 1 started!');
      resolve();
    });
  });
  hostSocket.emit(SOCKET_EVENTS.CLIENT_GAME_START);
  await game1StartedPromise;

  // Wait for Game 1 to finish
  const game1FinishedPromise = new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_GAME_FINISHED, (data: any) => {
      console.log('✓ Game 1 finished with winner:', data?.standings?.[0]?.nickname);
      resolve();
    });
  });
  await game1FinishedPromise;

  // Now the room is in status: 'finished'
  console.log('Room is now in FINISHED status. Simulating Host changing settings and clicking Return to Lobby / Play Again...');

  // Host clicks "Change Settings & Return to Lobby" which emits CLIENT_PLAY_AGAIN
  const returnToLobbyPromise = new Promise<void>((resolve) => {
    guestSocket.once(SOCKET_EVENTS.SERVER_ROOM_STATE, (state: any) => {
      if (state.status === 'lobby') {
        console.log('✓ Server transitioned room status to "lobby" and broadcasted to guest!');
        resolve();
      }
    });
  });
  hostSocket.emit(SOCKET_EVENTS.CLIENT_PLAY_AGAIN);
  await returnToLobbyPromise;

  // Host updates settings (e.g. changes language to english & roundCount: 1)
  console.log('Updating settings to Hollywood English tracks...');
  hostSocket.emit(SOCKET_EVENTS.CLIENT_SETTINGS_UPDATE, {
    languages: ['English'],
    categories: ['Hollywood'],
    eras: ['2020s'],
    roundCount: 1,
  });
  await new Promise((r) => setTimeout(r, 400));

  // Guest marks ready
  await new Promise<void>((resolve) => {
    const onState = (state: any) => {
      const g = state.players?.find((p: any) => p.playerId === guestPlayerId);
      if (g?.isReady) {
        hostSocket.off(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
        resolve();
      }
    };
    hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
    guestSocket.emit(SOCKET_EVENTS.CLIENT_READY_SET, { ready: true });
  });
  console.log('✓ Guest marked ready for Game 2.');

  // Host starts Game 2!
  const game2StartedPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Game 2 failed to start within 6 seconds!'));
    }, 6000);

    hostSocket.once(SOCKET_EVENTS.SERVER_GAME_STARTED, (payload: any) => {
      clearTimeout(timeout);
      console.log('✓ GAME 2 STARTED SUCCESSFULLY!', payload);
      resolve();
    });
  });

  const game2PreparePromise = new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_PREPARE, (payload: any) => {
      console.log('✓ Game 2 Round 1 prepared:', payload?.roundNumber, 'of', payload?.totalRounds);
      resolve();
    });
  });

  hostSocket.emit(SOCKET_EVENTS.CLIENT_GAME_START);
  await Promise.all([game2StartedPromise, game2PreparePromise]);

  console.log('--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  hostSocket.disconnect();
  guestSocket.disconnect();
  process.exit(0);
}

runRematchVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});

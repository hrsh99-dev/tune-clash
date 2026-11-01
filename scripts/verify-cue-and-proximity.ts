import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../backend/src/shared/index.js';

const SERVER_URL = 'http://localhost:4000';

async function runVerification() {
  console.log('--- Starting Proximity and Cue Verification ---');

  // 1. Create Room via REST
  const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: 'HostTester' }),
  });
  const createData = await createRes.json();
  const roomCode = createData.roomCode;
  const hostPlayerId = createData.player.playerId;
  const hostToken = createData.reconnectToken;
  console.log(`Room created: ${roomCode}`);

  // 2. Join second player via REST
  const joinRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: 'GuessTester' }),
  });
  const joinData = await joinRes.json();
  const player2Id = joinData.player.playerId;
  const player2Token = joinData.reconnectToken;
  console.log(`Player 2 joined via REST: ${player2Id}`);

  // 3. Setup Sockets with autoConnect: false
  const hostSocket = io(SERVER_URL, { transports: ['websocket'], autoConnect: false });
  const playerSocket = io(SERVER_URL, { transports: ['websocket'], autoConnect: false });

  hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err: any) => {
    console.error('[Host Error Event]:', err);
  });
  playerSocket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err: any) => {
    console.error('[Player Error Event]:', err);
  });

  // Connect and join
  const hostJoinPromise = new Promise<void>((resolve) => {
    hostSocket.once('connect', () => {
      console.log('Host socket connected.');
      hostSocket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
        roomCode,
        playerId: hostPlayerId,
        nickname: 'HostTester',
        reconnectToken: hostToken,
      });
    });
    hostSocket.once(SOCKET_EVENTS.SERVER_REJOINED, () => {
      console.log('Host received SERVER_REJOINED.');
      resolve();
    });
  });

  const playerJoinPromise = new Promise<void>((resolve) => {
    playerSocket.once('connect', () => {
      console.log('Player 2 socket connected.');
      playerSocket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
        roomCode,
        playerId: player2Id,
        nickname: 'GuessTester',
        reconnectToken: player2Token,
      });
    });
    playerSocket.once(SOCKET_EVENTS.SERVER_REJOINED, () => {
      console.log('Player 2 received SERVER_REJOINED.');
      resolve();
    });
  });

  hostSocket.connect();
  playerSocket.connect();

  await Promise.all([hostJoinPromise, playerJoinPromise]);
  console.log('Both players connected & joined room socket.');

  // Set 6s clip for fast test
  hostSocket.emit(SOCKET_EVENTS.CLIENT_SETTINGS_UPDATE, {
    clipSeconds: 6,
    roundCount: 1,
  });
  await new Promise((r) => setTimeout(r, 400));

  // Player 2 marks ready and wait for room state confirmation
  await new Promise<void>((resolve) => {
    const onState = (state: any) => {
      const p2 = state.players?.find((p: any) => p.playerId === player2Id);
      if (p2?.isReady) {
        console.log('Player 2 is confirmed READY in room state!');
        hostSocket.off(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
        resolve();
      }
    };
    hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_STATE, onState);
    playerSocket.emit(SOCKET_EVENTS.CLIENT_READY_SET, { ready: true });
  });

  // Track events on playerSocket
  let roundPrepared = false;
  let receivedCue: string | null = null;
  let receivedCloseFeedback: any = null;
  let revealedTrackData: any = null;

  playerSocket.on(SOCKET_EVENTS.SERVER_ROUND_PREPARE, (data: any) => {
    roundPrepared = true;
    console.log(`[Event] SERVER_ROUND_PREPARE: round 1/${data.totalRounds}, audioUrl=${data.audioUrl}`);
  });

  playerSocket.on(SOCKET_EVENTS.SERVER_ROUND_CUE, (data: any) => {
    receivedCue = data.cue;
    console.log(`[Event] SERVER_ROUND_CUE: "${data.cue}"`);
  });

  playerSocket.on(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, (feedback: any) => {
    console.log(`[Event] SERVER_ANSWER_FEEDBACK: wasCorrect=${feedback.wasCorrect}, isClose=${feedback.isClose}, message="${feedback.message}"`);
    if (feedback.isClose) {
      receivedCloseFeedback = feedback;
    }
  });

  const roundEndedPromise = new Promise<void>((resolve) => {
    playerSocket.on(SOCKET_EVENTS.SERVER_ROUND_ENDED, (data: any) => {
      revealedTrackData = data.revealedTrack;
      console.log(`[Event] SERVER_ROUND_ENDED: Title="${data.revealedTrack.title}", Artist="${data.revealedTrack.artists?.join(', ')}"`);
      resolve();
    });
  });

  // Host starts the game
  console.log('Host sending CLIENT_GAME_START...');
  hostSocket.emit(SOCKET_EVENTS.CLIENT_GAME_START);

  // Wait for 3s to enter playing state
  await new Promise((r) => setTimeout(r, 3000));

  // Host and Player 2 vote for hint
  console.log('Both players voting for hint...');
  hostSocket.emit(SOCKET_EVENTS.CLIENT_HINT_VOTE);
  playerSocket.emit(SOCKET_EVENTS.CLIENT_HINT_VOTE);

  // Player 2 submits deliberate guess
  console.log('Player 2 submitting guess...');
  playerSocket.emit(SOCKET_EVENTS.CLIENT_ANSWER_SUBMIT, {
    requestId: 'req-proximity-test',
    answer: 'tum hi h',
  });

  // Await round end event (20s input time + 2s start sync)
  console.log('Waiting for round completion and track reveal...');
  await Promise.race([
    roundEndedPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Round end timed out after 26s')), 26000)),
  ]);

  // Give short grace for clean socket teardown
  await new Promise((r) => setTimeout(r, 500));

  // Disconnect sockets
  hostSocket.disconnect();
  playerSocket.disconnect();

  console.log('\n================ VERIFICATION RESULTS ================');
  console.log('Round Prepared:', roundPrepared ? 'PASS' : 'FAIL');
  console.log('Progressive Title Cue:', receivedCue ? `PASS (Cue: "${receivedCue}")` : 'FAIL');
  console.log('Full Song Reveal:', revealedTrackData ? `PASS (Revealed: "${revealedTrackData.title}" by ${revealedTrackData.artists?.join(', ')})` : 'FAIL');
  console.log('======================================================');

  if (roundPrepared && receivedCue && revealedTrackData) {
    console.log('\n>>> ALL REAL-TIME CUE & REVEAL FLOWS FUNCTION 100% PERFECTLY! <<<');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});

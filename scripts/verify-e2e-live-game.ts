import { io } from 'socket.io-client';
import { SOCKET_EVENTS, HintVoteUpdatePayload } from '@tune-clash/shared';

const SERVER_URL = 'http://localhost:4000';

async function runE2EGameTest() {
  console.log('🚀 Starting Automated E2E Live Multiplayer Game Test...');

  // 1. Create Room via HTTP
  const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'DiscoKing',
      settings: {
        roundCount: 2,
        clipSeconds: 6,
        categories: ['Bollywood'],
        languages: ['Hindi'],
        chaosMode: true,
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create room: ${await createRes.text()}`);
  }

  const createData = await createRes.json();
  const roomCode = createData.roomCode;
  const hostPlayer = createData.player;
  const hostToken = createData.reconnectToken;

  console.log(`✅ Room Created: [${roomCode}] by Host: ${hostPlayer.nickname}`);

  // 2. Connect Host Socket
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise<void>((resolve, reject) => {
    hostSocket.on('connect', () => {
      hostSocket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
        roomCode,
        playerId: hostPlayer.playerId,
        reconnectToken: hostToken,
      });
      resolve();
    });
    hostSocket.on('connect_error', reject);
  });

  console.log('✅ Host connected to WebSocket room');

  // 3. Second Player joins via HTTP
  const joinRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: 'RhythmQueen' }),
  });

  if (!joinRes.ok) {
    throw new Error(`Player 2 join failed: ${await joinRes.text()}`);
  }

  const joinData = await joinRes.json();
  const player2 = joinData.player;
  const player2Token = joinData.reconnectToken;

  console.log(`✅ Player 2 Joined via HTTP: ${player2.nickname}`);

  const player2Socket = io(SERVER_URL, { transports: ['websocket'] });

  hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err) => {
    console.error('❌ Server Room Error received on Host:', err);
  });
  player2Socket.on(SOCKET_EVENTS.SERVER_ROOM_ERROR, (err) => {
    console.error('❌ Server Room Error received on Player 2:', err);
  });

  // 4. Connect Player 2 Socket
  await new Promise<void>((resolve, reject) => {
    player2Socket.on('connect', () => {
      player2Socket.emit(SOCKET_EVENTS.CLIENT_ROOM_JOIN, {
        roomCode,
        playerId: player2.playerId,
        reconnectToken: player2Token,
      });
    });
    player2Socket.once(SOCKET_EVENTS.SERVER_REJOINED, () => {
      resolve();
    });
    player2Socket.on('connect_error', reject);
  });

  console.log('✅ Player 2 socket joined and confirmed by server');

  // 5. Player 2 toggles ready and wait for confirmation in room state
  await new Promise<void>((resolve) => {
    hostSocket.on(SOCKET_EVENTS.SERVER_ROOM_STATE, function onReadyState(state) {
      const p2 = state.players.find((p: any) => p.playerId === player2.playerId);
      if (p2 && p2.isReady) {
        hostSocket.off(SOCKET_EVENTS.SERVER_ROOM_STATE, onReadyState);
        resolve();
      }
    });
    player2Socket.emit(SOCKET_EVENTS.CLIENT_READY_SET, { ready: true });
  });

  console.log('✅ Player 2 confirmed Ready in room state');

  // 6. Host starts game
  await new Promise((r) => setTimeout(r, 600));
  hostSocket.emit(SOCKET_EVENTS.CLIENT_GAME_START);
  console.log('✅ Host emitted CLIENT_GAME_START');

  // 7. Listen for SERVER_ROUND_PREPARE and wait for SERVER_ROUND_PLAY
  const round1: any = await new Promise((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_PREPARE, (data) => {
      console.log(`🎵 Round 1 Prepare received! Round ${data.roundNumber}/${data.totalRounds}, Modifier: ${data.modifier}`);
      resolve(data);
    });
  });

  // Wait for round to start playing (after countdown)
  await new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_PLAY, () => {
      console.log('▶️ Round 1 is now PLAYING!');
      resolve();
    });
  });

  // 8. Test Hint Voting: both vote for hint while playing
  console.log('🗳️ Testing unanimous Hint Voting...');
  hostSocket.emit(SOCKET_EVENTS.CLIENT_HINT_VOTE);
  player2Socket.emit(SOCKET_EVENTS.CLIENT_HINT_VOTE);

  const hintUpdate: any = await new Promise((resolve) => {
    hostSocket.on(SOCKET_EVENTS.SERVER_HINT_VOTE_UPDATE, (data: HintVoteUpdatePayload) => {
      console.log(`   Hint vote update: ${data.votesCount}/${data.requiredVotes}, revealed=${data.hintRevealed}`);
      if (data.hintRevealed) {
        console.log(`💡 Hint Revealed successfully! Cue: "${data.cue}"`);
        resolve(data);
      }
    });
  });

  if (!hintUpdate.cue) {
    throw new Error('Hint was revealed but cue was empty!');
  }

  // 9. Submit a guess for Host
  hostSocket.emit(SOCKET_EVENTS.CLIENT_ANSWER_SUBMIT, { requestId: 'req_1', answer: 'tum hi ho' });

  await new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ANSWER_FEEDBACK, (data) => {
      console.log(`📝 Answer result feedback: wasCorrect=${data.wasCorrect}, isClose=${data.isClose}, message="${data.message}"`);
      resolve();
    });
  });

  // 10. Wait for Round Ended
  const roundEndData: any = await new Promise((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_ENDED, (data) => {
      console.log(`🏁 Round Ended! Revealed Song: "${data.revealedTrack.title}" by ${data.revealedTrack.artists.join(', ')}`);
      resolve(data);
    });
  });

  // 11. Test Next Round
  if (!roundEndData.isLastRound) {
    console.log('⏭️ Host requesting Next Round...');
    await new Promise((r) => setTimeout(r, 800));
    hostSocket.emit(SOCKET_EVENTS.CLIENT_ROUND_NEXT);

    await new Promise((resolve) => {
      hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_PREPARE, (data) => {
        console.log(`🎵 Round 2 Prepare received! Round ${data.roundNumber}/${data.totalRounds}, Modifier: ${data.modifier}`);
        resolve(data);
      });
    });

    // Wait for Round 2 to finish
    await new Promise((resolve) => {
      hostSocket.once(SOCKET_EVENTS.SERVER_ROUND_ENDED, (data) => {
        console.log(`🏁 Round 2 Ended! Song: "${data.revealedTrack.title}"`);
        resolve(data);
      });
    });
  }

  // 12. Advance to Final Results
  console.log('🏆 Advancing to Final Results...');
  await new Promise((r) => setTimeout(r, 600));
  hostSocket.emit(SOCKET_EVENTS.CLIENT_ROUND_NEXT);

  const gameFinished: any = await new Promise((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_GAME_FINISHED, (data) => {
      console.log('🎉 SERVER_GAME_FINISHED received! Final Standings:');
      data.standings.forEach((s: any) => console.log(`   Rank ${s.rank}: ${s.nickname} - ${s.score} pts (Streak: ${s.longestStreak})`));
      resolve(data);
    });
  });

  // 13. Test Rematch / Change Settings back to Lobby
  console.log('🔄 Testing Host Rematch / Reset to Lobby...');
  hostSocket.emit(SOCKET_EVENTS.CLIENT_PLAY_AGAIN);

  await new Promise<void>((resolve) => {
    hostSocket.once(SOCKET_EVENTS.SERVER_ROOM_STATE, (state) => {
      if (state.status === 'lobby') {
        console.log(`✅ Room successfully reset to Lobby for new game! Status: ${state.status}`);
        resolve();
      }
    });
  });

  // Clean up
  hostSocket.disconnect();
  player2Socket.disconnect();

  console.log('\n================================================================');
  console.log('🎉 COMPLETE MULTIPLAYER GAME LOOP VERIFIED WITH ZERO ERRORS!');
  console.log('================================================================');
  process.exit(0);
}

runE2EGameTest().catch((err) => {
  console.error('❌ E2E Game Test failed:', err);
  process.exit(1);
});

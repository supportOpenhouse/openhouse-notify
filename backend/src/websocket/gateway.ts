import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { appConfig } from '@config/index';
import { logger } from '@infrastructure/logger';

let io: SocketServer | null = null;

export function createWebSocketGateway(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: appConfig.cors.origins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.debug('WebSocket: client connected', { socketId: socket.id });

    socket.on('disconnect', (reason) => {
      logger.debug('WebSocket: client disconnected', { socketId: socket.id, reason });
    });

    socket.on('error', (err) => {
      logger.error('WebSocket: socket error', { socketId: socket.id, err });
    });
  });

  logger.info('WebSocket gateway initialized');
  return io;
}

export function getWebSocketServer(): SocketServer | null {
  return io;
}

export function emitToAll(event: string, data: unknown): void {
  io?.emit(event, data);
}

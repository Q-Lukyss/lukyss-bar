import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class CommandesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join:commande')
  handleJoin(
    @MessageBody() token: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`commande:${token}`);
  }

  emitStatusUpdate(publicToken: string, status: string) {
    this.server
      .to(`commande:${publicToken}`)
      .emit('commande:status', { status });
  }
}

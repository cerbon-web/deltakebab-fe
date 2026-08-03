import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket?: Socket;

  connect(token?: string) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = io(environment.apiBaseUrl.replace(/\/api$/, ''), {
      path: '/socket.io',
      auth: {
        token
      }
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}

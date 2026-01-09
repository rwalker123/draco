import crypto from 'crypto';

interface SseTicket {
  ticket: string;
  userId: string;
  matchId: bigint;
  accountId: bigint;
  gameId?: bigint;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

const TICKET_EXPIRY_MS = 60 * 1000; // 60 seconds
const CLEANUP_INTERVAL_MS = 30 * 1000; // 30 seconds

class SseTicketManager {
  private tickets: Map<string, SseTicket> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  createTicket(
    userId: string,
    matchId: bigint,
    accountId: bigint,
  ): { ticket: string; expiresIn: number } {
    const ticket = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TICKET_EXPIRY_MS);

    this.tickets.set(ticket, {
      ticket,
      userId,
      matchId,
      accountId,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return {
      ticket,
      expiresIn: TICKET_EXPIRY_MS / 1000,
    };
  }

  validateTicket(
    ticket: string,
    matchId: bigint,
  ): { valid: true; userId: string; accountId: bigint } | { valid: false; reason: string } {
    const ticketData = this.tickets.get(ticket);

    if (!ticketData) {
      return { valid: false, reason: 'Ticket not found' };
    }

    if (ticketData.used) {
      return { valid: false, reason: 'Ticket already used' };
    }

    if (new Date() > ticketData.expiresAt) {
      this.tickets.delete(ticket);
      return { valid: false, reason: 'Ticket expired' };
    }

    if (ticketData.matchId !== matchId) {
      return { valid: false, reason: 'Ticket not valid for this match' };
    }

    ticketData.used = true;

    return {
      valid: true,
      userId: ticketData.userId,
      accountId: ticketData.accountId,
    };
  }

  createAccountTicket(userId: string, accountId: bigint): { ticket: string; expiresIn: number } {
    const ticket = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TICKET_EXPIRY_MS);

    this.tickets.set(ticket, {
      ticket,
      userId,
      matchId: BigInt(0),
      accountId,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return {
      ticket,
      expiresIn: TICKET_EXPIRY_MS / 1000,
    };
  }

  validateAccountTicket(
    ticket: string,
    accountId: bigint,
  ): { valid: true; userId: string } | { valid: false; reason: string } {
    const ticketData = this.tickets.get(ticket);

    if (!ticketData) {
      return { valid: false, reason: 'Ticket not found' };
    }

    if (ticketData.used) {
      return { valid: false, reason: 'Ticket already used' };
    }

    if (new Date() > ticketData.expiresAt) {
      this.tickets.delete(ticket);
      return { valid: false, reason: 'Ticket expired' };
    }

    if (ticketData.accountId !== accountId) {
      return { valid: false, reason: 'Ticket not valid for this account' };
    }

    ticketData.used = true;

    return {
      valid: true,
      userId: ticketData.userId,
    };
  }

  createGameTicket(
    userId: string,
    gameId: bigint,
    accountId: bigint,
  ): { ticket: string; expiresIn: number } {
    const ticket = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TICKET_EXPIRY_MS);

    this.tickets.set(ticket, {
      ticket,
      userId,
      matchId: BigInt(0),
      accountId,
      gameId,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return {
      ticket,
      expiresIn: TICKET_EXPIRY_MS / 1000,
    };
  }

  validateGameTicket(
    ticket: string,
    gameId: bigint,
  ): { valid: true; userId: string; accountId: bigint } | { valid: false; reason: string } {
    const ticketData = this.tickets.get(ticket);

    if (!ticketData) {
      return { valid: false, reason: 'Ticket not found' };
    }

    if (ticketData.used) {
      return { valid: false, reason: 'Ticket already used' };
    }

    if (new Date() > ticketData.expiresAt) {
      this.tickets.delete(ticket);
      return { valid: false, reason: 'Ticket expired' };
    }

    if (ticketData.gameId !== gameId) {
      return { valid: false, reason: 'Ticket not valid for this game' };
    }

    ticketData.used = true;

    return {
      valid: true,
      userId: ticketData.userId,
      accountId: ticketData.accountId,
    };
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL_MS);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, ticketData] of this.tickets.entries()) {
      if (now > ticketData.expiresAt || ticketData.used) {
        this.tickets.delete(key);
      }
    }
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

let instance: SseTicketManager | null = null;

export function getSseTicketManager(): SseTicketManager {
  if (!instance) {
    instance = new SseTicketManager();
  }
  return instance;
}

export type { SseTicket };

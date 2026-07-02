import { ParticipantResponse, SchedulingRequest } from './types';

export class MultiParticipantCoordinator {
  private invitations: Map<string, ParticipantResponse> = new Map();

  async sendInvitations(request: SchedulingRequest, meetingId: string): Promise<string[]> {
    const inviteIds: string[] = [];

    for (const participant of request.participants) {
      const inviteId = `invite_${Date.now()}_${Math.random()}`;
      this.invitations.set(inviteId, {
        email: participant,
        name: participant.split('@')[0],
        status: 'pending',
      });
      inviteIds.push(inviteId);
    }

    return inviteIds;
  }

  recordResponse(inviteId: string, status: 'accepted' | 'declined', responseTime?: string) {
    const invitation = this.invitations.get(inviteId);
    if (invitation) {
      invitation.status = status;
      invitation.responseTime = responseTime || new Date().toISOString();
      this.invitations.set(inviteId, invitation);
    }
  }

  getResponses(inviteIds: string[]): ParticipantResponse[] {
    return inviteIds
      .map((id) => this.invitations.get(id))
      .filter((inv) => inv !== undefined) as ParticipantResponse[];
  }

  checkAllAccepted(inviteIds: string[]): boolean {
    const responses = this.getResponses(inviteIds);
    return responses.length > 0 && responses.every((r) => r.status === 'accepted');
  }

  getPendingResponses(inviteIds: string[]): ParticipantResponse[] {
    return this.getResponses(inviteIds).filter((r) => r.status === 'pending');
  }
}

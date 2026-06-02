import { Injectable, NotFoundException } from '@nestjs/common';
import { Campus, CampusRequest, CampusRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Campuses come from 42. A campus only lands in the table once staff approve it:
 * on login we either attach the user to an existing campus or open a pending
 * request for the staff to review.
 */
@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every approved campus, alphabetical. */
  list(): Promise<Campus[]> {
    return this.prisma.campus.findMany({ orderBy: { label: 'asc' } });
  }

  /**
   * Run on every 42 login. If the campus already exists the user is attached to
   * it; otherwise a pending request is opened for staff (one per label) and the
   * user stays without a campus until it gets approved.
   */
  async syncFortyTwoCampus(userId: string, label: string): Promise<void> {
    const campus = await this.prisma.campus.findUnique({ where: { label } });
    if (campus) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { campusId: campus.id },
      });
      return;
    }

    const pending = await this.prisma.campusRequest.findFirst({
      where: { label, status: CampusRequestStatus.PENDING },
    });
    if (!pending) {
      await this.prisma.campusRequest.create({
        data: { label, requestedById: userId },
      });
    }
  }

  /** Pending campus requests awaiting staff review (newest first). */
  listRequests(): Promise<CampusRequest[]> {
    return this.prisma.campusRequest.findMany({
      where: { status: CampusRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Staff approves a request: the campus is created (if missing) and the user
   * who asked for it is attached to it.
   */
  async approve(requestId: string): Promise<Campus> {
    const request = await this.requirePending(requestId);

    return this.prisma.$transaction(async (tx) => {
      const campus = await tx.campus.upsert({
        where: { label: request.label },
        update: {},
        create: { label: request.label },
      });
      await tx.user.update({
        where: { id: request.requestedById },
        data: { campusId: campus.id },
      });
      await tx.campusRequest.update({
        where: { id: request.id },
        data: { status: CampusRequestStatus.APPROVED },
      });
      return campus;
    });
  }

  /** Staff rejects a request; no campus is created. */
  async decline(requestId: string): Promise<void> {
    const request = await this.requirePending(requestId);
    await this.prisma.campusRequest.update({
      where: { id: request.id },
      data: { status: CampusRequestStatus.REJECTED },
    });
  }

  private async requirePending(requestId: string): Promise<CampusRequest> {
    const request = await this.prisma.campusRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.status !== CampusRequestStatus.PENDING) {
      throw new NotFoundException('Campus request not found');
    }
    return request;
  }
}

import { Prisma, PrismaClient } from '#prisma/client';
import { IPhotoSubmissionRepository } from '../interfaces/IPhotoSubmissionRepository.js';
import {
  dbApprovePhotoSubmissionInput,
  dbCreatePhotoSubmissionInput,
  dbDenyPhotoSubmissionInput,
  dbPhotoGalleryAlbum,
  dbPhotoSubmission,
  dbPhotoSubmissionWithRelations,
} from '../types/dbTypes.js';
import { ConflictError, NotFoundError } from '../../utils/customErrors.js';

const submissionSelect = {
  id: true,
  accountid: true,
  teamid: true,
  albumid: true,
  submittercontactid: true,
  moderatedbycontactid: true,
  approvedphotoid: true,
  title: true,
  caption: true,
  originalfilename: true,
  originalfilepath: true,
  primaryimagepath: true,
  thumbnailimagepath: true,
  status: true,
  denialreason: true,
  submittedat: true,
  updatedat: true,
  moderatedat: true,
} as const;

const submissionInclude = {
  accounts: {
    select: {
      id: true,
      name: true,
    },
  },
  photogalleryalbum: {
    select: {
      id: true,
      accountid: true,
      issystem: true,
      title: true,
      parentalbumid: true,
      teamid: true,
    },
  },
  photogallery: {
    select: {
      id: true,
      title: true,
      albumid: true,
    },
  },
  submitter: {
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
    },
  },
  moderator: {
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
    },
  },
} as const;

type ModerationUpdateData = {
  moderatedbycontactid: bigint;
  approvedphotoid: bigint | null;
  status: 'Approved' | 'Denied';
  moderatedat: Date;
  updatedat: Date;
  denialreason: string | null;
};

export class PrismaPhotoSubmissionRepository implements IPhotoSubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSubmission(data: dbCreatePhotoSubmissionInput): Promise<dbPhotoSubmission> {
    return this.prisma.photogallerysubmission.create({
      data: {
        accountid: data.accountid,
        teamid: data.teamid ?? null,
        albumid: data.albumid ?? null,
        submittercontactid: data.submittercontactid,
        title: data.title,
        caption: data.caption ?? null,
        originalfilename: data.originalfilename,
        originalfilepath: data.originalfilepath,
        primaryimagepath: data.primaryimagepath,
        thumbnailimagepath: data.thumbnailimagepath,
      },
      select: submissionSelect,
    });
  }

  async findSubmissionById(submissionId: bigint): Promise<dbPhotoSubmission | null> {
    return this.prisma.photogallerysubmission.findUnique({
      where: { id: submissionId },
      select: submissionSelect,
    });
  }

  async findSubmissionForAccount(
    accountId: bigint,
    submissionId: bigint,
  ): Promise<dbPhotoSubmission | null> {
    return this.prisma.photogallerysubmission.findFirst({
      where: {
        id: submissionId,
        accountid: accountId,
      },
      select: submissionSelect,
    });
  }

  async findSubmissionWithRelations(
    submissionId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations | null> {
    return this.prisma.photogallerysubmission.findUnique({
      where: { id: submissionId },
      include: submissionInclude,
    });
  }

  async findPendingSubmissionsForAccount(
    accountId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations[]> {
    return this.prisma.photogallerysubmission.findMany({
      where: {
        accountid: accountId,
        status: 'Pending',
      },
      include: submissionInclude,
      orderBy: {
        submittedat: 'asc',
      },
    });
  }

  async findPendingSubmissionsForTeam(
    accountId: bigint,
    teamId: bigint,
  ): Promise<dbPhotoSubmissionWithRelations[]> {
    return this.prisma.photogallerysubmission.findMany({
      where: {
        accountid: accountId,
        teamid: teamId,
        status: 'Pending',
      },
      include: submissionInclude,
      orderBy: {
        submittedat: 'asc',
      },
    });
  }

  async findAlbumForAccount(
    accountId: bigint,
    albumId: bigint,
  ): Promise<dbPhotoGalleryAlbum | null> {
    return this.prisma.photogalleryalbum.findFirst({
      where: {
        id: albumId,
        accountid: accountId,
      },
      select: {
        id: true,
        accountid: true,
        teamid: true,
        parentalbumid: true,
        issystem: true,
        title: true,
      },
    });
  }

  async approveSubmission(
    submissionId: bigint,
    data: dbApprovePhotoSubmissionInput,
  ): Promise<dbPhotoSubmission> {
    return this.updatePendingSubmission(submissionId, {
      moderatedbycontactid: data.moderatedbycontactid,
      approvedphotoid: data.approvedphotoid,
      status: 'Approved',
      moderatedat: data.moderatedat,
      updatedat: data.updatedat,
      denialreason: null,
    });
  }

  async denySubmission(
    submissionId: bigint,
    data: dbDenyPhotoSubmissionInput,
  ): Promise<dbPhotoSubmission> {
    return this.updatePendingSubmission(submissionId, {
      moderatedbycontactid: data.moderatedbycontactid,
      approvedphotoid: null,
      status: 'Denied',
      moderatedat: data.moderatedat,
      updatedat: data.updatedat,
      denialreason: data.denialreason,
    });
  }

  async deleteSubmission(submissionId: bigint): Promise<void> {
    await this.prisma.photogallerysubmission.delete({
      where: { id: submissionId },
    });
  }

  async revertApproval(submissionId: bigint): Promise<void> {
    const result = await this.prisma.photogallerysubmission.updateMany({
      where: {
        id: submissionId,
        status: 'Approved',
      },
      data: {
        status: 'Pending',
        moderatedbycontactid: null,
        approvedphotoid: null,
        moderatedat: null,
        denialreason: null,
        updatedat: new Date(),
      } as Prisma.photogallerysubmissionUpdateManyMutationInput,
    });

    if (result.count === 0) {
      throw new ConflictError('Photo submission approval could not be reverted');
    }
  }

  private async updatePendingSubmission(
    submissionId: bigint,
    data: ModerationUpdateData,
  ): Promise<dbPhotoSubmission> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.photogallerysubmission.updateMany({
        where: {
          id: submissionId,
          status: 'Pending',
        },
        data: {
          moderatedbycontactid: data.moderatedbycontactid,
          approvedphotoid: data.approvedphotoid,
          status: data.status,
          moderatedat: data.moderatedat,
          updatedat: data.updatedat,
          denialreason: data.denialreason,
        } as unknown as Prisma.photogallerysubmissionUpdateManyMutationInput,
      });

      const submission = await tx.photogallerysubmission.findUnique({
        where: { id: submissionId },
        select: submissionSelect,
      });

      if (result.count === 0) {
        if (!submission) {
          throw new NotFoundError('Photo submission not found');
        }

        throw new ConflictError('Photo submission has already been moderated');
      }

      if (!submission) {
        throw new ConflictError('Photo submission could not be retrieved after moderation');
      }

      return submission;
    });
  }
}

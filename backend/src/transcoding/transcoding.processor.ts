import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TranscodingService } from './transcoding.service';

export interface TranscodingJobData {
  videoId: string;
  originalS3Key: string;
  userId: string;
}

@Processor('transcoding')
export class TranscodingProcessor {
  private readonly logger = new Logger(TranscodingProcessor.name);

  constructor(private transcodingService: TranscodingService) {}

  @Process('transcode-video')
  async handleTranscode(job: Job<TranscodingJobData>) {
    const { videoId, originalS3Key } = job.data;
    
    this.logger.log(`Processing transcoding job ${job.id} for video ${videoId}`);
    
    await this.transcodingService.transcodeVideo(videoId, originalS3Key);
    
    return { videoId, status: 'completed' };
  }

  @OnQueueActive()
  onActive(job: Job<TranscodingJobData>) {
    this.logger.log(`Job ${job.id} has started processing video ${job.data.videoId}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job<TranscodingJobData>, result: any) {
    this.logger.log(`Job ${job.id} completed for video ${result.videoId}`);
  }

  @OnQueueFailed()
  onError(job: Job<TranscodingJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed for video ${job.data.videoId}:`, error.message);
  }
}

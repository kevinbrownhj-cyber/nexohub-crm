import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('imports')
export class ImportsProcessor {
  @Process('process-import')
  async handleImport(job: Job) {
    console.log('Processing import job:', job.id);
    return {};
  }
}

import VvuCrawlerDemo from './VvuCrawlerDemo';
import { getSampleInitialization } from '@/src/lib/vvu-crawler/index.js';

export const dynamic = 'force-dynamic';

export default async function DemoPage() {
  const initialData = await getSampleInitialization();

  return <VvuCrawlerDemo initialData={initialData} />;
}

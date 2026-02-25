import PackageClient from './PackageClient';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Explicitly allow dynamic parameters that were not generated at build time
export const dynamicParams = true;

// Define empty static params to ensure the route is treated as dynamic
export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  console.log(`[Page] Rendering package detail for ID: ${id}`);
  
  return <PackageClient id={id} />;
}

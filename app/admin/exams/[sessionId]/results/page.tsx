import ResultsClient from "./_components/ResultsClient";

export default async function ExamResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ResultsClient sessionId={sessionId} />;
}


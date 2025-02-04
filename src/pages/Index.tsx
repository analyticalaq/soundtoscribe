import AudioRecorder from '../components/AudioRecorder';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="container py-12">
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-4xl font-bold text-neutral-900">Audio to Text</h1>
          <p className="text-neutral-600">Record your voice and get instant transcription</p>
        </div>
        <AudioRecorder />
      </main>
    </div>
  );
};

export default Index;

import AudioRecorder from '../components/AudioRecorder';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="container py-12">
        <div className="flex flex-col items-center justify-center mb-12 space-y-4">
          <img 
            src="https://www.mobix.fr/wp-content/themes/mobix/assets/svg/mobix-logo.svg" 
            alt="MOBIX Logo" 
            className="h-16 w-auto mb-2"
          />
          <h1 className="text-4xl font-bold text-neutral-900">Audio to Text</h1>
          <p className="text-neutral-600">Record your voice and get instant transcription</p>
        </div>
        <AudioRecorder />
        <div className="text-center mt-8">
          <p className="text-sm text-neutral-600">Powered By MOBIX</p>
        </div>
      </main>
    </div>
  );
};

export default Index;

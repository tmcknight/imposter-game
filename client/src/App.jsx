import { useGame } from './context/GameContext.jsx';
import JoinScreen from './components/JoinScreen.jsx';
import Lobby from './components/Lobby.jsx';
import WordReveal from './components/WordReveal.jsx';
import HintPhase from './components/HintPhase.jsx';
import VotingPhase from './components/VotingPhase.jsx';
import Results from './components/Results.jsx';
import { XMarkIcon } from '@heroicons/react/24/outline';

function App() {
  const { phase, error, clearError } = useGame();

  const renderPhase = () => {
    switch (phase) {
      case null:
        return <JoinScreen />;
      case 'LOBBY':
        return <Lobby />;
      case 'WORD_REVEAL':
        return <WordReveal />;
      case 'HINTING_1':
      case 'HINTING_2':
        return <HintPhase />;
      case 'VOTING':
        return <VotingPhase />;
      case 'RESULTS':
        return <Results />;
      default:
        return <JoinScreen />;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 min-h-dvh flex flex-col">
      <header className="text-center py-4">
        <h1 className="text-3xl tracking-widest uppercase text-accent font-bold title-glow select-none">
          Imposter
        </h1>
        <div className="mt-1 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </header>
      {error && (
        <div
          className="bg-accent/90 backdrop-blur-sm text-white p-3 rounded-xl mb-4 cursor-pointer flex justify-between items-center glow-accent animate-scale-in"
          onClick={clearError}
        >
          {error}
          <XMarkIcon className="w-6 h-6 shrink-0" />
        </div>
      )}
      <main className="flex-1 flex flex-col" key={phase}>
        {renderPhase()}
      </main>
    </div>
  );
}

export default App;

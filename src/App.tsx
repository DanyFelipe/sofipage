import { useState, useCallback } from 'react';
import { SceneCanvas } from './components/SceneCanvas/SceneCanvas';
import { Curtain } from './components/Curtain/Curtain';
import { ObjectModal } from './components/ObjectModal/ObjectModal';
import { LetterModal } from './components/LetterModal/LetterModal';
import type { InteractiveObject } from './scene/objects/InteractiveObject';

interface ModalData {
  label: string;
  content: string;
}

function App() {
  const [isCurtainOpen, setIsCurtainOpen] = useState(false);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  const handleObjectClick = useCallback((obj: InteractiveObject) => {
    if (obj.label === 'Letter') {
      setIsLetterOpen(true);
    } else {
      setModal({ label: obj.label, content: obj.content });
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleCloseLetter = useCallback(() => {
    setIsLetterOpen(false);
  }, []);

  return (
    <>
      <SceneCanvas onObjectClick={handleObjectClick} />
      <Curtain isOpen={isCurtainOpen} onUnlock={() => setIsCurtainOpen(true)} />

      {modal && (
        <ObjectModal
          label={modal.label}
          content={modal.content}
          onClose={handleCloseModal}
        />
      )}

      {isLetterOpen && (
        <LetterModal onClose={handleCloseLetter} />
      )}
    </>
  );
}

export default App;

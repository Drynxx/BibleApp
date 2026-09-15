import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingState {
  intent: string | null;
  translation: string | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  setIntent: (intent: string) => void;
  setTranslation: (translation: string) => void;
  clearState: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    intent: null,
    translation: null,
  });

  const setIntent = (intent: string) => {
    setState((prev) => ({ ...prev, intent }));
  };

  const setTranslation = (translation: string) => {
    setState((prev) => ({ ...prev, translation }));
  };

  const clearState = () => {
    setState({ intent: null, translation: null });
  };

  return (
    <OnboardingContext.Provider value={{ state, setIntent, setTranslation, clearState }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

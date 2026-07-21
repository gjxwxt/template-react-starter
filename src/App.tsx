import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { AppProvider } from './app/providers';
import { AppRouter } from './app/router';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;

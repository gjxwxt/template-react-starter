import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { templateRouterBasename } from './app/config';
import { AppRouter } from './app/router';
import { AppProvider } from './app/providers';

const App: React.FC = () => {
  return (
    <BrowserRouter basename={templateRouterBasename}>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;

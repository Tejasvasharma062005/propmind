import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/Router';

export function App() {
  return <RouterProvider router={router} />;
}

export default App;

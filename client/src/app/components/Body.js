'use client';

import { ToastContainer, Slide } from 'react-toastify';

export default function Body({ children }) {
  return (
    <body className="text-gray-900 bg-gray-100">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        closeButton={false}
        theme="colored"
        transition={Slide}
      />
      {children}
    </body>
  );
}

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ErrorPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    if (router.query.error) {
      setErrorMessage(router.query.error as string);
    }
  }, [router.query]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-4xl font-bold mb-4">Authentication Error</h1>
      {errorMessage && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => router.push('/')}
      >
        Return Home
      </button>
    </div>
  );
}
// Some component
import { signIn, signOut, useSession } from "next-auth/react"

function AuthX() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <p>Welcome, {session.user.name}!</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return (
    <button onClick={() => signIn('twitter')}>Sign in with X</button>
  );
}

export default AuthX;

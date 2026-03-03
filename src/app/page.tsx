import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect from the landing page directly to the login
  // Once the user authenticates, the Next.js middleware in Phase 0 handles 
  // routing them to their respective role-based dashboard based on the 
  // redirect URL or the default route.
  redirect('/login');
}

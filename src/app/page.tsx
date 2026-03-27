import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  // If not logged in, go to login.
  if (!session?.user) {
    redirect('/login');
  }

  // If logged in, automatically route to the corresponding dashboard.
  const role = (session.user as any).role;

  switch (role) {
    case 'EMPLOYEE':
      redirect('/employee');
    case 'STUDENT':
      redirect('/student');
    case 'OFFICIAL':
      redirect('/official');
    case 'SECURITY':
      redirect('/security');
    case 'OIC_STUDENT_SECTION':
      redirect('/oic');
    case 'ADMIN':
      redirect('/admin');
    default:
      // If no valid role is found, fallback to login
      redirect('/login');
  }
}

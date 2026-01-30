import { $path } from 'next-typesafe-url';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect($path({ route: '/dashboard' }));
}

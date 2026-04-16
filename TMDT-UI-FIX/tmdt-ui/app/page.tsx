import { redirect } from 'next/navigation';

// Trang gốc "/" redirect sang trang chủ thực sự trong route group (public)
export default function RootPage() {
  redirect('/home');
}

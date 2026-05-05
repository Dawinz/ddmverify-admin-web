import {
  BookOpenCheck,
  Building2,
  CreditCard,
  Handshake,
  House,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserSquare2,
} from 'lucide-react';

export const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/agents', label: 'Agents', icon: UserSquare2 },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/bookings', label: 'Bookings', icon: House },
  { href: '/admin/deals', label: 'Deals', icon: Handshake },
  { href: '/admin/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/admin/payment-proofs', label: 'Payment Proofs', icon: BookOpenCheck },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
] as const;

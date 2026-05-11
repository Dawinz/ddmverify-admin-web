import {
  Bell,
  BookOpenCheck,
  Building2,
  ClipboardList,
  CreditCard,
  Handshake,
  House,
  LayoutDashboard,
  ShieldAlert,
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
  { href: '/admin/payment-methods', label: 'Payment Controls', icon: CreditCard },
  { href: '/admin/payment-proofs', label: 'Payment Proofs', icon: BookOpenCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/admin/audit', label: 'Audit log', icon: ClipboardList },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
] as const;

import {
  Microscope,
  Layers,
  Droplets,
  FlaskConical,
  ClipboardCheck,
  Beaker,
  TestTube,
  Factory,
  GraduationCap,
  Briefcase,
  Container,
  Cog,
  type LucideIcon,
} from 'lucide-react';

/** Соответствие строкового имени иконки (из i18n servicesData.icon) и компонента lucide. */
export const serviceIcons: Record<string, LucideIcon> = {
  Microscope,
  Layers,
  Droplets,
  FlaskConical,
  ClipboardCheck,
  Beaker,
  TestTube,
  Factory,
  GraduationCap,
  Briefcase,
  Container,
  Cog,
};

export function getServiceIcon(name: string): LucideIcon {
  return serviceIcons[name] ?? Cog;
}

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import Container from '@/components/ui/Container';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary-900 text-white">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-white">Metric Solution</h3>
            <p className="text-secondary-300 text-sm">
              Профессиональные решения в области геометаллургии и обогащения полезных ископаемых
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-secondary-300 hover:text-primary-400 transition-colors">О компании</Link></li>
              <li><Link href="/services" className="text-secondary-300 hover:text-primary-400 transition-colors">Услуги</Link></li>
              <li><Link href="/projects" className="text-secondary-300 hover:text-primary-400 transition-colors">Проекты</Link></li>
              <li><Link href="/team" className="text-secondary-300 hover:text-primary-400 transition-colors">Команда</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Услуги</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services/geometallurgy" className="text-secondary-300 hover:text-primary-400 transition-colors">Геометаллургия</Link></li>
              <li><Link href="/services/metal-balance" className="text-secondary-300 hover:text-primary-400 transition-colors">Баланс металлов</Link></li>
              <li><Link href="/services/ore-research" className="text-secondary-300 hover:text-primary-400 transition-colors">Исследование руды</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Контакты</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@metricsolution.com" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  info@metricsolution.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+77172000000" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  +7 (717) 200-00-00
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-300">
                  г. Астана, Казахстан
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-secondary-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-400">
            <p>&copy; {currentYear} Metric Solution. Все права защищены.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-primary-400 transition-colors">
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
